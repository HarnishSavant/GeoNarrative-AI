import json
import logging
from typing import Dict, Any, List

logger = logging.getLogger("geonarrative.geoai.intent_router")

class IntentRouter:
    """
    GeoAI Intent Router
    Classifies natural language queries into specific spatial intelligence intents.
    Extracts relevant entities (locations, POI types, risk levels) for the Query Planner.
    """
    
    SYSTEM_PROMPT = """You are the GeoNarrative Intent Router, a core component of a Spatial Digital Twin.
Your job is to analyze the user's natural language query and map it STRICTLY to one of the following intents:

1. RiskIntent: Inquiries about overall flood risk, high risk zones, or vulnerable areas globally. (e.g., "Show high risk zones", "Which areas have the highest flood risk?")
2. ExposureIntent: Inquiries about how many assets (buildings, roads, generally) are exposed. (e.g., "How much of the city is exposed?")
3. InfrastructureIntent: Specific inquiries about critical infrastructure (hospitals, schools, substations) at risk. (e.g., "Which hospitals are exposed?", "How many schools are at risk?")
4. ShelterIntent: Inquiries about emergency planning, safe assembly areas, evacuation routes, or shelter locations. (e.g., "Recommend shelter locations", "Find safe assembly areas")
5. SpatialSearchIntent: Inquiries involving spatial relationships like "near", "within", "inside" (e.g., "Find hospitals near rivers", "Show schools inside high risk zones", "Find critical infrastructure within 500m of waterways")
6. AnalyticsIntent: Complex requests requiring aggregation or mathematical insights (e.g., "Calculate the total exposed road length by risk class")
7. GeneralIntent: Greetings, non-spatial questions, or general platform help.

You must respond ONLY in JSON format, with no markdown formatting.
Schema:
{
  "intent": "IntentName",
  "entities": {
    "feature_types": [], // e.g., ["hospital", "school", "road"]
    "risk_classes": [],  // e.g., ["High", "Very High"]
    "spatial_relation": "", // e.g., "near", "within", "inside"
    "distance_m": null // e.g., 500
  },
  "confidence": 0.0 // 0.0 to 1.0
}
"""

    @staticmethod
    async def route(query: str) -> Dict[str, Any]:
        """Classify query using Gemini and return intent payload."""
        logger.info(f"Routing intent for query: '{query}'")
        
        contents = [{"role": "user", "content": query}]
        
        from app.services.geoai_orchestrator import GeoAIOrchestrator
        
        # Use json_mode=True from GeoAIOrchestrator
        response_text = await GeoAIOrchestrator.call_llm(
            contents=contents, 
            system_instruction=IntentRouter.SYSTEM_PROMPT, 
            json_mode=True
        )
        
        try:
            # Clean up markdown if Gemini returned it despite instructions
            if response_text.startswith("```json"):
                response_text = response_text[7:-3]
                
            parsed = json.loads(response_text)
            
            # Validation
            valid_intents = ["RiskIntent", "ExposureIntent", "InfrastructureIntent", "ShelterIntent", "SpatialSearchIntent", "AnalyticsIntent", "GeneralIntent"]
            if parsed.get("intent") not in valid_intents:
                parsed["intent"] = "GeneralIntent"
                
            return parsed
            
        except json.JSONDecodeError as e:
            logger.error(f"Intent Router JSON Parse Error: {str(e)} - Raw: {response_text}")
            return {
                "intent": "GeneralIntent",
                "entities": {},
                "confidence": 0.0,
                "fallback": True
            }
