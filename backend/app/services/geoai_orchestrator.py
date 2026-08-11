"""
GeoNarrative AI — Multi-Agent GeoAI Intelligence System
Upgraded from a template-driven assistant to a true multi-agent system.
Implements: Intent Routing, Tool Selection, Memory, Document Analysis,
Weather Integration, Prediction Handling, Truthfulness, and Report Gen.
"""

import os
import json
import logging
import httpx
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.services.spatial_query_service import SpatialQueryService
from app.services.weather_service import WeatherService
from app.services.prediction_service import PredictionService
from app.repositories.data_store import search_locations_db
from app.services.geoai.intent_router import IntentRouter
from app.services.geoai.query_planner import QueryPlanner
from app.services.geoai.gemini_client import GeminiClient

logger = logging.getLogger("geonarrative.geoai_orchestrator")

class GeoAIOrchestrator:
    # ── SYSTEM PROMPTS FROM SKILLS DIRECTORY ──
    MASTER_PROMPT = """You are GeoNarrative AI, an advanced Evidence-Driven GeoAI Copilot.
You combine the expertise of: GIS Analyst, Urban Planner, Infrastructure Consultant, and Data Scientist.
Your primary objective: Transform raw spatial data into actionable intelligence and answer the user's specific questions directly without hallucinating.

IMPORTANT RULES:
1. For GENERAL_KNOWLEDGE or PLATFORM_HELP intents: Answer naturally and conversationally like ChatGPT.
2. For GEO_ANALYSIS or FORECASTING: You MUST use the provided [POSTGIS RAW SPATIAL QUERY RESULTS] as your primary source of truth. However, you MUST augment your answer with your own vast geographic, cartographic, and urban planning knowledge. 
3. MULTI-AGENT PERSONA: You will be given an [ASSIGNED PERSONA] (e.g., Urban Planning Agent, Infrastructure Agent). Fully adopt this persona in your writing style and focus.
4. CONTEXT-AWARE ANSWERING: You must answer the SPECIFIC question asked by the user (e.g., if they ask "How many schools?", give the exact count. If "Which hospitals?", list them). DO NOT return generic template reports. Provide conversational, flowing paragraphs, not just bulleted lists.
5. Provide implications and recommendations based on the findings.
6. You are context-aware. Maintain conversation memory. Assume the current active city is the context.
7. Never hallucinate local datasets or invent statistics.

MANDATORY OUTPUT FORMAT FOR GIS/DATA QUERIES:
[Your clear, conversational, and highly intelligent answer to the user's question. Explain the implications of the data. Sound like an expert consultant.]

**Evidence Used:**
- [List data sources used from context, e.g., OpenStreetMap, PostGIS]

**Confidence Score:**
- [Use the exact percentage provided in the context]

**Recommendations:**
- [Actionable insights tailored to the specific findings]"""

    INTENT_ROUTING_PROMPT = """Analyze the user query and memory to classify intent.
Categories:
1. GENERAL_KNOWLEDGE (e.g., What is GIS?)
2. PLATFORM_HELP (e.g., How do I use this?)
3. WEATHER (e.g., Rain today)
4. GEO_ANALYSIS (e.g., Analyze Pune, Flood risk)
5. FORECASTING (e.g., Prediction, Flood risk 2030)
6. DOCUMENT_ANALYSIS (e.g., Analyze uploaded file)
7. REPORT_GENERATION (e.g., Generate report)
Respond with ONLY the category name."""

    TRUTHFULNESS_PROMPT = """TRUTHFULNESS LAYER:
If data in the context is unavailable or insufficient:
You MUST explicitly state: "I do not currently have enough evidence to calculate this precisely."
Then explain the methodology of how it WOULD be calculated if data were available.

Never invent:
- population counts
- flood percentages
- rainfall values
- hospital counts
- risk scores
unless the exact number is present in the RETRIEVED DATA CONTEXT."""

    STYLE_PROMPT = """Response style: Like ChatGPT. Conversational but expert. No excessive consultant jargon. Prioritize usefulness."""

    @staticmethod
    async def call_llm(contents: List[Dict[str, Any]], system_instruction: Optional[str] = None, json_mode: bool = False) -> str:
        """Call Gemini LLM using the unified GeminiClient with model cascade and retries."""
        result = await GeminiClient.generate(
            contents=contents,
            system_instruction=system_instruction,
            json_mode=json_mode,
            temperature=0.15,
            max_tokens=4096,
        )
        # Return empty string on error for backward compatibility with existing callers
        if result.startswith("[ERROR]"):
            logger.error(f"GeminiClient returned: {result}")
            return ""
        return result

    @staticmethod
    async def classify_intent(query: str, has_files: bool) -> Dict[str, Any]:
        """1. Build Intent Classification Layer"""
        if has_files and any(x in query.lower() for x in ["file", "document", "upload", "summarize", "csv", "data"]):
            return {"intent": "DOCUMENT_ANALYSIS", "entities": {}}
            
        # Call the new Intent Router
        intent_payload = await IntentRouter.route(query)
        
        # Override with WEATHER or FORECASTING if needed based on simple rules, 
        # or just trust the IntentRouter which defaults to GeneralIntent
        q = query.lower()
        if any(x in q for x in ["predict", "forecast", "future", "2030", "machine learning"]):
            return {"intent": "FORECASTING", "entities": {}}
        if any(x in q for x in ["weather", "rain", "temperature", "storm"]):
            return {"intent": "WEATHER", "entities": {}}
        if any(x in q for x in ["report", "pdf", "generate", "download"]):
            return {"intent": "REPORT_GENERATION", "entities": {}}
            
        return intent_payload

    @staticmethod
    async def get_tool_context(intent_payload: Dict[str, Any], query: str, location: str, db: AsyncSession, uploaded_files: List[Dict]) -> Dict[str, Any]:
        """4. Build Tool Selection Layer & Context Retrieval"""
        intent = intent_payload.get("intent", "GeneralIntent")
        context_data = ""
        tool_used = "None"
        confidence = "High"
        spatial_results = {}
        data_points = 0

        # Attempt to geocode location if provided
        lat, lng = 18.5204, 73.8567 # default Pune
        from app.services.osm_service import OSMService
        if location:
            geo = await OSMService.geocode_city(location)
            if geo:
                lat, lng = geo["lat"], geo["lon"]

        # 5. Dataset Validation (Requested city == Loaded city)
        from app.services.osm_service import OSMService
        if location and intent in ["GEO_ANALYSIS", "FORECASTING"]:
            loaded_city = OSMService.get_loaded_city()
            if location.lower() != loaded_city.lower() and location.lower() != "unknown":
                logger.info(f"City mismatch! Requested: {location}, Loaded: {loaded_city}. Initiating dynamic fetch.")
                success = await OSMService.load_city_to_db(db, location)
                if not success:
                    confidence = "Low"
                    return {
                        "context": f"Failed to retrieve dynamic geospatial data for {location} from OpenStreetMap. Proceed with general knowledge but explicitly state that you lack real-time local data.",
                        "tool": "OpenStreetMap Geocoding Error",
                        "confidence": "Low",
                        "data_points": 0,
                        "spatial_results": {}
                    }
                else:
                    context_data += f"\n[METADATA]\nAnalysis Source: OpenStreetMap\nCity: {location}\nRetrieved: Dynamically fetched just now\n"
            else:
                context_data += f"\n[METADATA]\nAnalysis Source: OpenStreetMap (Cached)\nCity: {location}\nRetrieved: From Local Cache\n"

        if intent == "WEATHER":
            tool_used = "Weather API"
            weather_data = await WeatherService.get_live_weather(lat, lng, location)
            if "error" not in weather_data:
                context_data = f"[WEATHER API DATA FOR {location}]\n{json.dumps(weather_data.get('current', {}), indent=2)}\nFlood Impact: {json.dumps(weather_data.get('flood_impact', {}), indent=2)}"
            else:
                context_data = f"Weather data currently unavailable. Error: {weather_data['error']}"
                confidence = "Low"

        elif intent == "DOCUMENT_ANALYSIS" and uploaded_files:
            tool_used = "Document Parsing Engine"
            context_data = "[UPLOADED DOCUMENTS DATA]\n"
            for f in uploaded_files:
                context_data += f"File Name: {f.get('name')}\nType: {f.get('type')}\nSize: {f.get('size', 0)} bytes\nPreview/Features: {f.get('features', 'N/A')}\n---\n"
                data_points += 1

        elif intent == "FORECASTING":
            tool_used = "Prediction Engine (XGBoost/RF)"
            # Simulate a request
            from app.models.schemas import PredictionRequest
            req = PredictionRequest(location=location, domain="flood")
            pred_data = await PredictionService.calculate_risk(req, db)
            context_data = f"[ML PREDICTION DATA FOR {location}]\nRisk Level: {pred_data['overall_risk']}\nScore: {pred_data['score']}/10\nFactors: {json.dumps(pred_data['factors'], indent=2)}"
            confidence = f"Model Confidence: {pred_data.get('model_metrics', {}).get('regression', {}).get('random_forest', {}).get('r2_score', 0.85)}"
            spatial_results["prediction"] = pred_data
            data_points += 1

        elif intent in ["RiskIntent", "ExposureIntent", "InfrastructureIntent", "ShelterIntent", "SpatialSearchIntent", "AnalyticsIntent"]:
            tool_used = "Spatial Query Engine"
            
            # Use the new modular Query Planner!
            raw_spatial = await QueryPlanner.execute_plan(intent_payload, db)
            
            # 5.3 If DB fails, AI returns 'Data not available' - NO FALLBACKS
            if raw_spatial.get("status") == "error" or not raw_spatial.get("data"):
                context_data = "STRICT INSTRUCTION: The database query failed or returned 0 results. You MUST state EXACTLY 'Data not available in the spatial database.' Do not attempt to guess or hallucinate any statistics."
                confidence = "None"
                data_points = 0
                spatial_results = {}
                tool_used = "PostGIS Spatial Engine (Failed)"
            else:
                raw_spatial["city_wide_totals"] = await SpatialQueryService.get_total_feature_counts(db)
                
                persona = "GeoAI Spatial Analyst"
                if intent == "ShelterIntent": persona = "Emergency Management Coordinator"
                elif intent == "InfrastructureIntent": persona = "Infrastructure Resiliency Expert"

                import json
                context_data = f"[ASSIGNED PERSONA: {persona}]\n[POSTGIS RAW SPATIAL QUERY RESULTS]\n{json.dumps(raw_spatial, indent=2)}"
                confidence = "High"
                data_points = len(raw_spatial.get("data", []))
                spatial_results = raw_spatial
                tool_used = "PostGIS Spatial Engine + LLM Reasoning"
            
        elif intent == "GeneralIntent":
            tool_used = "General AI Knowledge"
            context_data = "No specific spatial context required. Rely on general urban planning and GIS knowledge."

        elif intent == "REPORT_GENERATION":
            tool_used = "Report Generation Engine"
            context_data = f"System Instruction: The user wants a formal report. Acknowledge this, summarize what will be in the report based on {location}, and inform them that the PDF report generator has been triggered."

        elif intent == "PLATFORM_HELP":
            tool_used = "Platform Knowledge Base"
            context_data = "[PLATFORM KNOWLEDGE]\nGeoNarrative AI features: Chat, Map, Dashboard (Flood, Traffic, Urban), Predictions (ML), Reports (PDF). Subscriptions: Free, Premium."

        return {
            "context": context_data,
            "tool": tool_used,
            "confidence": confidence,
            "data_points": data_points,
            "spatial_results": spatial_results
        }

    @staticmethod
    async def generate_response(
        query: str,
        location: str,
        history: List[Dict[str, str]],
        db: AsyncSession,
        uploaded_files: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """2. Response Orchestration Layer"""
        import time
        start_time = time.perf_counter()

        location = location or "Pune"
        has_files = bool(uploaded_files and len(uploaded_files) > 0)

        # 1. Intent Detection
        intent_payload = await GeoAIOrchestrator.classify_intent(query, has_files)
        intent = intent_payload.get("intent", "GeneralIntent")
        logger.info(f"Detected Intent: {intent}")

        # 2. Tool Selection & Context Retrieval
        tool_data = await GeoAIOrchestrator.get_tool_context(intent_payload, query, location, db, uploaded_files)
        
        # 3. Build Final System Prompt (Truthfulness + Style + Master)
        system_instruction = f"{GeoAIOrchestrator.MASTER_PROMPT}\n\n{GeoAIOrchestrator.TRUTHFULNESS_PROMPT}\n\n{GeoAIOrchestrator.STYLE_PROMPT}\n\n"
        system_instruction += f"Current Location Context: {location}\nDetected Intent: {intent}\n\n"
        
        if tool_data["context"]:
            system_instruction += f"--- RETRIEVED DATA CONTEXT (Do not hallucinate outside this) ---\n{tool_data['context']}\n---------------------------------\n"
            system_instruction += f"System Calculated Confidence: {tool_data['confidence']}\nUse this exact confidence in your output.\n"

        # 4. Memory Layer Construction
        contents = []
        for msg in history[-5:]: # Keep last 5 messages for context
            contents.append({
                "role": "user" if msg.get("role") == "user" else "assistant",
                "content": msg.get("content", "")
            })
        contents.append({"role": "user", "content": query})

        # 5. Reasoning & Answer Validation
        llm_reply = await GeoAIOrchestrator.call_llm(contents, system_instruction)

        # Fallback if LLM fails
        if not llm_reply or "HTTP" in llm_reply:
            if "429" in llm_reply or "503" in llm_reply:
                fallback_report = tool_data.get("spatial_results", {}).get("fallback_report")
                if fallback_report:
                    llm_reply = fallback_report
                elif tool_data.get('context'):
                    llm_reply = tool_data['context']
                else:
                    llm_reply = "Spatial Analysis Complete, but no data was retrieved."
            else:
                llm_reply = f"I'm sorry, I am currently unable to connect to the Gemini intelligence engine. (Error: {llm_reply})"

        processing_time = round(time.perf_counter() - start_time, 4)

        # 6. Response Generation
        return {
            "message": llm_reply,
            "metadata": {
                "location": location,
                "data_points": tool_data["data_points"],
                "sources": ["Gemini 2.5 Flash", tool_data["tool"]],
                "detected_tool": tool_data["tool"],
                "processing_time": processing_time,
                "agent_trace": {
                    "user_query": query,
                    "detected_intent": intent,
                    "selected_tool": tool_data["tool"],
                    "confidence_score": tool_data["confidence"],
                    "processing_time": processing_time,
                    "spatial_operation": tool_data.get("spatial_results", {}).get("query_type", "None"),
                    "parameters": {"location": location, "confidence": tool_data["confidence"]},
                    "records_found": tool_data["data_points"],
                    "map_action": "None"
                }
            }
        }
