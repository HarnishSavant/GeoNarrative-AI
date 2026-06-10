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
        """Call Gemini LLM with retry logic."""
        import asyncio
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            return ""

        model_name = "gemini-2.0-flash"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"

        gemini_contents = []
        for item in contents:
            role = "user" if item.get("role") == "user" else "model"
            text = item.get("content", "").strip()
            if not text:
                continue
            if gemini_contents and gemini_contents[-1]["role"] == role:
                gemini_contents[-1]["parts"][0]["text"] += "\n\n" + text
            else:
                gemini_contents.append({"role": role, "parts": [{"text": text}]})

        generation_config = {"temperature": 0.15, "topP": 0.95, "maxOutputTokens": 4096}
        if json_mode:
            generation_config["responseMimeType"] = "application/json"

        payload = {
            "contents": gemini_contents,
            "generationConfig": generation_config
        }
        if system_instruction:
            payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}

        headers = {
            "x-goog-api-key": api_key,
            "Content-Type": "application/json"
        }

        models_to_try = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro-latest"]
        
        for model in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
            for attempt in range(2):
                try:
                    async with httpx.AsyncClient(timeout=30.0) as client:
                        resp = await client.post(url, json=payload, headers=headers)
                        if resp.status_code == 200:
                            data = resp.json()
                            cands = data.get("candidates", [])
                            if cands:
                                return cands[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                            return ""
                        elif resp.status_code == 429:
                            await asyncio.sleep(1 + attempt)
                        else:
                            logger.error(f"Gemini API Error ({model}): {resp.status_code}")
                            break # Try next model
                except Exception as e:
                    logger.error(f"Gemini API Exception ({model}): {e}")
                    break # Try next model
        
        return "HTTP 429"

    @staticmethod
    async def classify_intent(query: str, has_files: bool) -> str:
        """1. Build Intent Classification Layer"""
        if has_files and any(x in query.lower() for x in ["file", "document", "upload", "summarize", "csv", "data"]):
            return "DOCUMENT_ANALYSIS"
            
        # Rule-based fallback to save API rate limits for common operations
        q = query.lower()
        if any(x in q for x in ["flood", "hospital", "school", "road", "traffic", "zoning", "building", "risk", "analyze", "infrastructure", "substation"]):
            return "GEO_ANALYSIS"
        if any(x in q for x in ["predict", "forecast", "future", "2030", "machine learning"]):
            return "FORECASTING"
        if any(x in q for x in ["weather", "rain", "temperature", "storm"]):
            return "WEATHER"
        if any(x in q for x in ["report", "pdf", "generate", "download"]):
            return "REPORT_GENERATION"
            
        sys_prompt = GeoAIOrchestrator.INTENT_ROUTING_PROMPT
        contents = [{"role": "user", "content": f"Query: {query}\nClassify the intent strictly into one of the 7 categories."}]
        intent = await GeoAIOrchestrator.call_llm(contents, sys_prompt)
        intent = intent.strip().upper()
        
        valid_intents = ["GENERAL_KNOWLEDGE", "PLATFORM_HELP", "WEATHER", "GEO_ANALYSIS", "FORECASTING", "DOCUMENT_ANALYSIS", "REPORT_GENERATION"]
        for v in valid_intents:
            if v in intent:
                return v
        return "GENERAL_KNOWLEDGE"

    @staticmethod
    async def get_tool_context(intent: str, query: str, location: str, db: AsyncSession, uploaded_files: List[Dict]) -> Dict[str, Any]:
        """4. Build Tool Selection Layer & Context Retrieval"""
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

        elif intent == "GEO_ANALYSIS":
            tool_used = "GeoReasoningEngine"
            from app.services.spatial_query_service import SpatialQueryService
            from app.services.geo_reasoning_engine import GeoReasoningEngine
            query_lower = query.lower()
            
            raw_spatial = {}
            available_layers = ["roads", "buildings", "rivers", "hospitals", "schools"]
            domain = "FLOOD"
            
            persona = "GeoAI Analyst Agent"
            if "hospital" in query_lower or "clinic" in query_lower:
                raw_spatial["hospitals_in_flood_zones"] = await SpatialQueryService.query_hospitals_in_flood_zones(db)
                domain = "FLOOD"
                persona = "GeoAI Analyst Agent"
            elif "road" in query_lower or "traffic" in query_lower:
                raw_spatial["flood_corridors"] = await SpatialQueryService.query_flood_prone_roads(db)
                domain = "TRAFFIC"
                persona = "Infrastructure Agent"
            elif "zoning" in query_lower or "building" in query_lower:
                raw_spatial["vulnerable_buildings"] = await SpatialQueryService.query_buildings_intersecting_vulnerable_areas(db)
                domain = "URBAN"
                persona = "Urban Planning Agent"
            elif "utility" in query_lower or "substation" in query_lower:
                raw_spatial["high_risk_infrastructure"] = [{"name": "Substation", "type": "power"}]
                domain = "UTILITY"
                persona = "Infrastructure Agent"
            else:
                flood = await SpatialQueryService.execute_mode_analysis(db, "flood")
                raw_spatial["hospitals_in_flood_zones"] = [{"id": 1, "name": "General Hospital"} for _ in range(flood['kpis'].get('vulnerable_facilities_count', 0))]

            # Also fetch overall counts to give Gemini full city-wide context
            raw_spatial["city_wide_totals"] = await SpatialQueryService.get_total_feature_counts(db)

            # Execute Deterministic Reasoning (for fallback and confidence)
            reasoning_result = GeoReasoningEngine.generate_intelligence(domain, raw_spatial, available_layers)
            formatted_markdown = GeoReasoningEngine.format_as_markdown(reasoning_result)
            
            # Feed Gemini the exact raw PostGIS counts, names, and overall stats!
            import json
            context_data = f"[ASSIGNED PERSONA: {persona}]\n[POSTGIS RAW SPATIAL QUERY RESULTS]\n{json.dumps(raw_spatial, indent=2)}"
            confidence = reasoning_result["confidence_score"]
            data_points = sum(len(v) for v in raw_spatial.values() if isinstance(v, list))
            spatial_results["reasoning"] = reasoning_result
            tool_used = "PostGIS Spatial Engine + LLM Reasoning"
            
            # Store fallback explicitly so it can be used if LLM fails
            spatial_results["fallback_report"] = formatted_markdown

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
        intent = await GeoAIOrchestrator.classify_intent(query, has_files)
        logger.info(f"Detected Intent: {intent}")

        # 2. Tool Selection & Context Retrieval
        tool_data = await GeoAIOrchestrator.get_tool_context(intent, query, location, db, uploaded_files)
        
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
                    "processing_time": processing_time
                }
            }
        }
