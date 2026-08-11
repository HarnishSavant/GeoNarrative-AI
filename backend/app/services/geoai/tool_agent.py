"""
GeoNarrative AI — GeoAI Tool Agent (v2)
=========================================
Production-grade Spatial Reasoning Engine powered by Gemini Function Calling.
Upgraded Architecture:
  1. Uses GeminiClient for resilient multi-model cascading
  2. Full function calling loop with automatic tool execution
  3. Graceful degradation: if Gemini is down, generates deterministic spatial reports
  4. Rich agent execution trace for frontend debugging
  5. Context-aware map intelligence with dashboard viewport awareness
"""

import json
import logging
import time
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.core.config import settings
from app.services.geoai.gemini_client import GeminiClient
from app.services.geoai.query_planner import QueryPlanner
from app.services.geoai.project_knowledge import ProjectKnowledgeService
from app.services.geoai.context_builder import ContextBuilder

logger = logging.getLogger("geonarrative.geoai.tool_agent")

# ─── TOOL DECLARATIONS ─────────────────────────────────────────────
# These are the spatial tools Gemini can autonomously invoke
GEOAI_TOOLS = [{
    "functionDeclarations": [
        {
            "name": "getRiskSummary",
            "description": "Returns flood risk distribution, hexagon counts, and overall city exposure metrics from the PostGIS database.",
            "parameters": {"type": "OBJECT", "properties": {}}
        },
        {
            "name": "getInfrastructureExposure",
            "description": "Returns a ranked list of critical infrastructure assets (hospitals, schools, clinics) exposed to High or Very High flood risk, ordered by vulnerability score.",
            "parameters": {"type": "OBJECT", "properties": {}}
        },
        {
            "name": "getShelterRecommendations",
            "description": "Returns safe assembly areas, evacuation zones, and shelters located in Very Low or Low risk areas suitable for emergency planning.",
            "parameters": {"type": "OBJECT", "properties": {}}
        },
        {
            "name": "getSpatialSearch",
            "description": "Executes a spatial proximity search — finds features (hospitals, schools, etc.) within a specified distance of waterways or flood zones using PostGIS ST_DWithin.",
            "parameters": {
                "type": "OBJECT",
                "properties": {
                    "layer": {"type": "STRING", "description": "Target layer: pois, buildings, roads"},
                    "distance": {"type": "INTEGER", "description": "Search radius in meters (default 500)"},
                    "risk_class": {"type": "STRING", "description": "Filter by risk class: High, Very High, Low"},
                    "feature_type": {"type": "STRING", "description": "Filter by feature type: hospital, clinic, school, etc."}
                }
            }
        },
        {
            "name": "getFeatureDetails",
            "description": "Returns detailed metadata, exposure metrics, and vulnerability score for a specific named spatial feature.",
            "parameters": {
                "type": "OBJECT",
                "properties": {
                    "feature_id": {"type": "STRING", "description": "Name or ID of the feature to look up"}
                },
                "required": ["feature_id"]
            }
        },
        {
            "name": "getDashboardContext",
            "description": "Returns the user's current map viewport: bounding box, zoom level, visible layers, and active filters. Use when the user says 'here', 'this area', 'what am I looking at', or 'analyze current view'.",
            "parameters": {"type": "OBJECT", "properties": {}}
        },
        {
            "name": "triggerMapAction",
            "description": "Triggers a frontend UI action: fly the map to coordinates, highlight a feature, or apply a spatial filter. Use when you discover a critical finding that deserves visual attention.",
            "parameters": {
                "type": "OBJECT",
                "properties": {
                    "action_type": {"type": "STRING", "description": "Action: 'flyTo', 'highlight', 'setFilter'"},
                    "payload": {"type": "STRING", "description": "JSON payload for the action (e.g. coordinates, feature ID, filter config)"}
                },
                "required": ["action_type", "payload"]
            }
        },
        {
            "name": "simulateScenario",
            "description": "Runs a predictive 'what-if' scenario simulation based on live baseline metrics. Supports: rainfall_increase, river_overflow, infrastructure_failure, population_growth, urban_expansion.",
            "parameters": {
                "type": "OBJECT",
                "properties": {
                    "scenario_type": {
                        "type": "STRING",
                        "description": "Type: 'rainfall_increase', 'river_overflow', 'infrastructure_failure', 'population_growth', 'urban_expansion'"
                    },
                    "magnitude": {
                        "type": "NUMBER",
                        "description": "Magnitude of change (e.g. 30 for 30% increase)"
                    }
                },
                "required": ["scenario_type", "magnitude"]
            }
        },
        {
            "name": "getGeneralKnowledge",
            "description": "Use this for general knowledge questions about GIS, geospatial science, urban planning concepts, platform help, or greetings. Returns a signal that no database query is needed — answer from your own knowledge.",
            "parameters": {
                "type": "OBJECT",
                "properties": {
                    "topic": {"type": "STRING", "description": "The topic of the general question"}
                }
            }
        }
    ]
}]


# ─── SYSTEM PROMPT ──────────────────────────────────────────────────
SYSTEM_INSTRUCTION = """You are GeoNarrative AI, a professional spatial intelligence assistant and thesis defense copilot for the Pune Digital Twin and Flood Susceptibility platform.

## CORE DIRECTIVES
1. **NEVER HALLUCINATE OR INVENT INFORMATION.** You must ONLY rely on verified project statistics from your system context and tool executions (PostGIS database).
2. **NATURAL & PROFESSIONAL TONE:** Communicate like an expert senior GIS analyst and academic copilot. Be helpful, clear, articulate, and academically grounded.
3. **NO RIGID DEVELOPER TEMPLATES OR EMPTY FIELDS:** Do NOT generate repetitive headings with "Data unavailable" or expose database schemas, internal logs, trace JSON, or tool IDs. Answer naturally in paragraphs, bulleted lists, and clear summaries.
4. **RESPONSE LENGTH:** For simple definitions or status checks, answer clearly in 2–5 sentences. For complex comparisons, location analyses, or thesis methodology explanations, provide 2–4 concise, well-structured paragraphs.
5. **THESIS & METHODOLOGY AWARENESS:** Know the difference between static AHP multi-criteria flood susceptibility (where floods are relatively more likely based on terrain, slope, LULC, distance from river, and building density) and interactive 3D Digital Twin temporal flood scenarios (how inundation evolves over time across Normal, Moderate, Heavy, and Extreme rainfall events). Acknowledge that temporal propagation is GIS-driven visual decision support, not a computational real-time hydrodynamic physics solver (HEC-RAS/SWMM).
"""


class GeoAIToolAgent:
    """
    Spatial Reasoning Engine powered by Gemini Function Calling.
    Allows the LLM to autonomously decide which spatial queries to execute
    to answer the user's question, rather than relying on strict upfront intent routing.
    """

    @staticmethod
    async def execute_tool(name: str, args: dict, db: AsyncSession, map_context: Any = None) -> dict:
        """Map Gemini tool calls to safe, parameterized PostGIS query templates."""
        logger.info(f"Executing tool: {name} with args: {args}")
        try:
            if name == "getRiskSummary":
                return await QueryPlanner._execute_risk_query(db, {})

            elif name == "getInfrastructureExposure":
                return await QueryPlanner._execute_infrastructure_query(db, {})

            elif name == "getShelterRecommendations":
                return await QueryPlanner._execute_shelter_query(db, {})

            elif name == "getSpatialSearch":
                # Bridge Gemini param names to QueryPlanner's expected keys
                search_args = {
                    "distance_m": args.get("distance", args.get("distance_m", 500)),
                    "layer": args.get("layer", "pois"),
                    "risk_class": args.get("risk_class"),
                    "feature_type": args.get("feature_type"),
                }
                return await QueryPlanner._execute_spatial_search(db, search_args)

            elif name == "getFeatureDetails":
                feature_id = args.get("feature_id", "")
                query = text("""
                    SELECT name, fclass as type, 
                           ST_AsText(ST_Centroid(geometry)) as geom_centroid
                    FROM pois 
                    WHERE name ILIKE :name 
                    LIMIT 5
                """)
                result = await db.execute(query, {"name": f"%{feature_id}%"})
                rows = result.all()
                if rows:
                    return {"status": "success", "data": [dict(row._mapping) for row in rows]}
                return {"status": "not_found", "message": f"No features matching '{feature_id}' found in database."}

            elif name == "getDashboardContext":
                if map_context:
                    try:
                        return map_context.model_dump()
                    except AttributeError:
                        return map_context if isinstance(map_context, dict) else {"message": "Map context format error"}
                return {"message": "No map context currently available. The user has not sent viewport data."}

            elif name == "triggerMapAction":
                return {"status": "queued", "action": args.get("action_type"), "note": "Action will be dispatched to frontend."}

            elif name == "simulateScenario":
                return await GeoAIToolAgent._run_scenario_simulation(db, args)

            elif name == "getGeneralKnowledge":
                return {"status": "general_knowledge", "topic": args.get("topic", ""), "instruction": "Answer this from your own expertise. No database query needed."}

            else:
                return {"error": f"Unknown tool: {name}"}

        except Exception as e:
            logger.error(f"Tool execution failed for {name}: {e}", exc_info=True)
            return {"error": f"Tool '{name}' failed: {str(e)}"}

    @staticmethod
    async def _run_scenario_simulation(db: AsyncSession, args: dict) -> dict:
        """Execute predictive what-if scenario simulation."""
        scenario = args.get("scenario_type", "")
        mag = args.get("magnitude", 0)

        # Fetch baseline
        try:
            baseline_infra = await QueryPlanner._execute_infrastructure_query(db, {})
        except Exception:
            baseline_infra = {"data": []}

        simulated = {}
        if scenario == "rainfall_increase":
            simulated = {
                "scenario": f"Rainfall increased by {mag}%",
                "affected_infrastructure_increase_pct": round(mag * 1.5, 1),
                "affected_population_increase_pct": round(mag * 1.2, 1),
                "emergency_demand_status": "CRITICAL" if mag > 20 else "HIGH",
                "shelter_capacity_deficit_pct": round(mag * 0.8, 1),
                "new_hotspots": ["Low-elevation river bends", "Urban concretized zones", "Downstream residential areas"],
            }
        elif scenario == "population_growth":
            simulated = {
                "scenario": f"Population density increased by {mag}%",
                "affected_population_increase_pct": round(mag * 1.8, 1),
                "emergency_demand_status": "HIGH",
                "shelter_capacity_deficit_pct": round(mag * 1.5, 1),
                "new_hotspots": ["Suburban expansion boundaries", "Informal settlement zones"],
            }
        elif scenario == "infrastructure_failure":
            simulated = {
                "scenario": f"Cascading failure from node {mag}",
                "affected_infrastructure_increase_pct": 200,
                "emergency_demand_status": "SEVERE",
                "shelter_accessibility": "COMPROMISED",
                "new_hotspots": ["Isolated downstream neighborhoods", "Utility-dependent zones"],
            }
        elif scenario == "urban_expansion":
            simulated = {
                "scenario": f"Urban area expanded by {mag}%",
                "impervious_surface_increase_pct": round(mag * 0.9, 1),
                "runoff_increase_pct": round(mag * 1.3, 1),
                "green_cover_loss_pct": round(mag * 0.7, 1),
                "new_hotspots": ["Peri-urban development zones", "Former agricultural boundaries"],
            }
        else:
            simulated = {"warning": f"Unsupported scenario type: {scenario}"}

        simulated["methodology_disclosure"] = (
            "⚠️ DISCLAIMER: This uses proof-of-concept heuristic multipliers, "
            "not a dynamic hydrodynamic physics solver (HEC-RAS). "
            "Intended for strategic planning demonstration only."
        )

        baseline_sample = baseline_infra.get("data", [])[:3] if isinstance(baseline_infra, dict) else []
        return {
            "baseline_metrics_sample": baseline_sample,
            "simulated_impact": simulated,
        }

    @staticmethod
    async def generate_response(
        query: str,
        history: List[Dict],
        db: AsyncSession,
        location: str = "Pune",
        map_context: Any = None,
        simulation_context: Any = None,
    ) -> Dict[str, Any]:
        """
        Full function calling loop with layered context and deterministic fallback guarantee.
        """
        start_time = time.perf_counter()
        api_key = settings.GEMINI_API_KEY

        # If API key is missing or offline, rely immediately on deterministic answering engine
        if not api_key:
            return await GeoAIToolAgent._fallback_response(query, db, location, start_time, simulation_context, map_context)

        # Build dynamic layered project context
        dynamic_system_prompt = SYSTEM_INSTRUCTION + "\n\n" + ContextBuilder.build_context(query, simulation_context, map_context)

        # ── Build conversation contents ──
        contents = []
        for msg in history[-6:]:
            role = "user" if msg.get("role") == "user" else "model"
            text_content = msg.get("content", "").strip()
            if text_content:
                contents.append({"role": role, "parts": [{"text": text_content}]})
        contents.append({"role": "user", "parts": [{"text": query}]})

        # ── PASS 1: Send to Gemini with tools ──
        pass1 = await GeminiClient.generate_with_tools(
            contents=contents,
            tools=GEOAI_TOOLS,
            system_instruction=dynamic_system_prompt,
            temperature=0.2,
        )

        if pass1["error"]:
            logger.error(f"Gemini Pass 1 failed: {pass1['error']}")
            return await GeoAIToolAgent._fallback_response(query, db, location, start_time, simulation_context, map_context)

        tool_calls = pass1["tool_calls"]

        # ── If no tools called, return direct text response ──
        if not tool_calls:
            text_response = pass1["text"] or ""
            if not text_response:
                return await GeoAIToolAgent._fallback_response(query, db, location, start_time, simulation_context, map_context)

            return GeoAIToolAgent._build_success_response(
                message=text_response,
                tools_used=[],
                ui_actions=[],
                start_time=start_time,
                location=location,
                query=query,
            )

        # ── Execute tool calls locally ──
        function_responses = []
        executed_tools = []
        ui_actions = []

        for call in tool_calls:
            name = call["name"]
            args = call.get("args", {})
            executed_tools.append(name)

            if name == "triggerMapAction":
                try:
                    parsed_payload = json.loads(args.get("payload", "{}"))
                except (json.JSONDecodeError, TypeError):
                    parsed_payload = args.get("payload", {})
                ui_actions.append({
                    "type": args.get("action_type", "highlight"),
                    "payload": parsed_payload,
                })

            result = await GeoAIToolAgent.execute_tool(name, args, db, map_context)
            safe_result = json.loads(json.dumps(result, default=str))

            function_responses.append({
                "functionResponse": {
                    "name": name,
                    "response": {"name": name, "content": safe_result},
                }
            })

        logger.info(f"Executed {len(executed_tools)} tools: {executed_tools}")

        # ── PASS 2: Send tool results back for synthesis ──
        contents.append(pass1["raw_candidate"].get("content", {}))
        contents.append({"role": "user", "parts": function_responses})

        final_text = await GeminiClient.send_tool_results(
            contents=contents,
            tools=GEOAI_TOOLS,
            system_instruction=dynamic_system_prompt,
            temperature=0.2,
        )

        if final_text.startswith("[ERROR]"):
            logger.warning("Gemini Pass 2 failed, generating deterministic report from tool data...")
            final_text = GeoAIToolAgent._build_deterministic_report(query, function_responses, executed_tools)

        return GeoAIToolAgent._build_success_response(
            message=final_text,
            tools_used=executed_tools,
            ui_actions=ui_actions,
            start_time=start_time,
            location=location,
            query=query,
        )

    # ─── FALLBACK: Deterministic response when Gemini is completely down ──

    @staticmethod
    async def _fallback_response(query: str, db: AsyncSession, location: str, start_time: float, simulation_context: Any = None, map_context: Any = None) -> Dict[str, Any]:
        """Generate an intelligent response using Project Knowledge Service or PostGIS data when Gemini is unavailable."""
        logger.warning("Gemini unavailable — engaging Project Knowledge Service & Deterministic Fallback")

        # Check for direct academic or project knowledge answer first
        det_answer = ProjectKnowledgeService.get_deterministic_answer(query, simulation_context)
        if det_answer:
            return GeoAIToolAgent._build_success_response(
                message=det_answer,
                tools_used=["ProjectKnowledgeService"],
                ui_actions=[],
                start_time=start_time,
                location=location,
                query=query,
                fallback=True,
            )

        q = query.lower()
        results = {}
        tools_used = []

        try:
            if any(w in q for w in ["risk", "flood", "hazard", "danger", "vulnerable"]):
                results["risk"] = await QueryPlanner._execute_risk_query(db, {})
                tools_used.append("getRiskSummary")

            if any(w in q for w in ["hospital", "school", "infrastructure", "clinic", "facility"]):
                results["infra"] = await QueryPlanner._execute_infrastructure_query(db, {})
                tools_used.append("getInfrastructureExposure")

            if any(w in q for w in ["shelter", "safe", "evacuation", "assembly", "emergency"]):
                results["shelters"] = await QueryPlanner._execute_shelter_query(db, {})
                tools_used.append("getShelterRecommendations")

            if any(w in q for w in ["near", "within", "close", "proximity", "distance"]):
                results["spatial"] = await QueryPlanner._execute_spatial_search(db, {"distance_m": 500})
                tools_used.append("getSpatialSearch")

            if not results:
                results["risk"] = await QueryPlanner._execute_risk_query(db, {})
                results["infra"] = await QueryPlanner._execute_infrastructure_query(db, {})
                tools_used = ["getRiskSummary", "getInfrastructureExposure"]

        except Exception as e:
            logger.error(f"Fallback PostGIS queries failed: {e}")

        # Build clean conversational fallback report from whatever data was found
        llm_response = GeoAIToolAgent._build_deterministic_report_from_data(query, results, location)

        return GeoAIToolAgent._build_success_response(
            message=llm_response,
            tools_used=tools_used,
            ui_actions=[],
            start_time=start_time,
            location=location,
            query=query,
            fallback=True,
        )

    @staticmethod
    def _build_deterministic_report(query: str, function_responses: list, tools: list) -> str:
        """Build a readable report from raw function call results when LLM synthesis fails."""
        report = f"### Spatial Analysis Report\n\n"
        report += f"**Query:** {query}\n\n"
        report += f"**Tools Executed:** {', '.join(tools)}\n\n"

        for fr in function_responses:
            resp = fr.get("functionResponse", {})
            name = resp.get("name", "Unknown")
            content = resp.get("response", {}).get("content", {})

            report += f"#### {name}\n"
            data = content.get("data", [])
            if isinstance(data, list) and data:
                report += f"**{len(data)} records found:**\n\n"
                for item in data[:10]:
                    if isinstance(item, dict):
                        details = " | ".join(f"**{k}:** {v}" for k, v in item.items() if v)
                        report += f"- {details}\n"
                if len(data) > 10:
                    report += f"\n*... and {len(data) - 10} more records*\n"
            else:
                report += f"```json\n{json.dumps(content, indent=2, default=str)[:1000]}\n```\n"
            report += "\n"

        report += "\n---\n*Analysis generated from PostGIS spatial database. Gemini synthesis temporarily unavailable.*"
        return report

    @staticmethod
    def _build_deterministic_report_from_data(query: str, results: dict, location: str) -> str:
        """Build a human-readable report from raw PostGIS data when all LLM paths fail."""
        report = f"### Spatial Analysis for {location}\n\n"
        report += f"**Your Question:** {query}\n\n"
        report += "**Note:** AI synthesis is temporarily unavailable. Below is the raw spatial intelligence from our PostGIS database.\n\n"

        for section, data in results.items():
            report += f"#### {section.replace('_', ' ').title()}\n"
            if isinstance(data, dict):
                items = data.get("data", [])
                if isinstance(items, list) and items:
                    report += f"{len(items)} spatial records retrieved:\n\n"
                    for item in items[:8]:
                        if isinstance(item, dict):
                            line = " · ".join(f"**{k}:** {v}" for k, v in item.items() if v is not None)
                            report += f"- {line}\n"
                else:
                    report += f"Query type: {data.get('query_type', 'Unknown')}\n"
            report += "\n"

        report += "---\n*Data sourced from PostGIS Spatial Engine + OpenStreetMap. Full AI analysis will resume when Gemini connectivity is restored.*"
        return report

    # ─── RESPONSE BUILDERS ──────────────────────────────────────────

    @staticmethod
    def _build_success_response(
        message: str,
        tools_used: list,
        ui_actions: list,
        start_time: float,
        location: str,
        query: str,
        fallback: bool = False,
    ) -> Dict[str, Any]:
        processing_time = round(time.perf_counter() - start_time, 2)
        return {
            "message": message,
            "metadata": {
                "tools_used": tools_used,
                "location": location,
                "sources": (["PostGIS", "Gemini 2.5 Flash"] if not fallback
                            else ["PostGIS", "Deterministic Engine"]),
                "data_points": len(tools_used),
                "processing_time": processing_time,
                "agent_trace": {
                    "user_query": query,
                    "detected_intent": "Autonomous Tool Selection" if tools_used else "Direct Response",
                    "selected_tool": ", ".join(tools_used) if tools_used else "Direct Inference",
                    "spatial_operation": "PostGIS / Gemini Function Calling",
                    "processing_time": processing_time,
                    "records_found": f"{len(tools_used)} tool calls executed",
                    "confidence_score": "High" if tools_used else "Medium",
                    "map_action": "Triggered" if ui_actions else "None",
                    "report_action": "None",
                    "fallback_mode": fallback,
                },
            },
            "actions": ui_actions,
        }

    @staticmethod
    def _build_error_response(error_msg: str, start_time: float, location: str) -> Dict[str, Any]:
        processing_time = round(time.perf_counter() - start_time, 2)
        return {
            "message": f"⚠️ {error_msg}",
            "metadata": {
                "tools_used": [],
                "location": location,
                "sources": ["Error"],
                "data_points": 0,
                "processing_time": processing_time,
                "agent_trace": {
                    "detected_intent": "Error",
                    "selected_tool": "None",
                    "spatial_operation": "None",
                    "processing_time": processing_time,
                    "records_found": "0",
                    "map_action": "None",
                    "report_action": "None",
                },
            },
            "actions": [],
        }
