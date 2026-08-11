"""
GeoNarrative AI — Context Builder Service
=========================================
Dynamically crafts high-precision, layered context for the GeoAI reasoning engine.
Ensures efficient token usage by including ONLY relevant project facts, live simulation
states, and layer metadata while internally classifying user query intents.
"""

import logging
from typing import Dict, Any, List, Optional
from app.services.geoai.project_knowledge import ProjectKnowledgeService

logger = logging.getLogger("geonarrative.geoai.context_builder")

class ContextBuilder:
    @staticmethod
    def classify_intent(query: str) -> str:
        """
        Internally classifies natural language queries into explicit spatial intents.
        These labels are used for context routing and debugging without exposing them in UI.
        """
        q = query.lower().strip()
        if any(w in q for w in ["compare", "difference between", "versus", "vs", "which scenario"]):
            return "SCENARIO_COMPARISON"
        if any(w in q for w in ["right now", "current scenario", "happening now", "currently flooded", "live"]):
            return "LIVE_SIMULATION"
        if any(w in q for w in ["why are some buildings", "red building", "yellow building", "orange road", "affected building"]):
            return "INFRASTRUCTURE_EXPOSURE"
        if any(w in q for w in ["dem", "slope", "lulc", "distance from river", "building density", "layer"]):
            return "LAYER_EXPLANATION"
        if any(w in q for w in ["susceptibility map", "ahp", "methodology", "how was susceptibility", "multi-criteria"]):
            return "PROJECT_METHOD"
        if any(w in q for w in ["digital twin", "3d", "why use 3d", "hydrodynamic", "hec-ras", "thesis", "novel", "limitation"]):
            return "DIGITAL_TWIN_EXPLANATION"
        if any(w in q for w in ["normal", "moderate", "heavy", "extreme", "scenario"]):
            return "SCENARIO_QUERY"
        if any(w in q for w in ["pune", "mula", "mutha", "study area", "pmc"]):
            return "PUNE_CONTEXT"
        if any(w in q for w in ["what is flood susceptibility", "hazard", "exposure", "risk difference"]):
            return "FLOOD_CONCEPT"
        if any(w in q for w in ["here", "selected location", "coordinate", "this point"]):
            return "LOCATION_ANALYSIS"
        if any(w in q for w in ["show", "turn on", "zoom to", "start scenario", "highlight"]):
            return "MAP_ACTION"
        if any(w in q for w in ["what is geonarrative", "about this project", "results"]):
            return "PROJECT_RESULT"
        return "GENERAL_GIS"

    @staticmethod
    def build_context(query: str, simulation_context: Optional[Dict[str, Any]] = None, map_context: Optional[Any] = None) -> str:
        """
        Constructs focused project context depending on query intent and active digital twin state.
        """
        intent = ContextBuilder.classify_intent(query)
        scenarios = ProjectKnowledgeService.get_scenarios()
        layers = ProjectKnowledgeService.get_layer_metadata()

        context_parts = [
            f"=== INTERNAL QUERY CLASSIFICATION: {intent} ===",
            "=== PUNE DIGITAL TWIN PROJECT KNOWLEDGE BASE ==="
        ]

        # PRIORITY 1: Live Digital Twin State
        if simulation_context or intent in ["LIVE_SIMULATION", "INFRASTRUCTURE_EXPOSURE", "SCENARIO_QUERY"]:
            sim_info = "LIVE SIMULATION STATE (Current Cesium WebGL View):"
            if simulation_context and isinstance(simulation_context, dict):
                for k, v in simulation_context.items():
                    sim_info += f"\n  - {k}: {v}"
            else:
                sim_info += "\n  - Simulation Status: Idle / Ready in Command Center"
                sim_info += "\n  - Available Scenarios: Normal (<100mm), Moderate (100-150mm), Heavy (150-250mm), Extreme (>250mm)"
            context_parts.append(sim_info)

        # PRIORITY 2 & 3: Project GIS Data & Scenarios
        if intent in ["SCENARIO_COMPARISON", "SCENARIO_QUERY", "PROJECT_RESULT", "LIVE_SIMULATION"]:
            scen_txt = "ACTUAL PROJECT SCENARIO STATISTICS (Do not invent numbers):"
            for s_name, stats in scenarios.items():
                scen_txt += f"\n  [{s_name.upper()}] Flooded Area: {stats.get('final_temporary_flood_km2', 0):.2f} km², Affected Buildings: {stats.get('affected_buildings', 0):,} ({stats.get('critical_buildings', 0):,} critical), Roads Impacted: {stats.get('affected_road_km', 0):.1f} km, Max Depth: {stats.get('max_depth_m', 0):.2f} m."
            context_parts.append(scen_txt)

        if intent in ["LAYER_EXPLANATION", "PROJECT_METHOD", "GENERAL_GIS"]:
            layer_txt = "PROJECT GIS LAYERS & METHODOLOGY (AHP Multi-Criteria):"
            for l_name, l_meta in layers.items():
                layer_txt += f"\n  - {l_name}: {l_meta.get('description')} (Role: {l_meta.get('role in analysis')})"
            context_parts.append(layer_txt)

        # PRIORITY 4 & 5: Thesis Defense & Pune Context
        if intent in ["DIGITAL_TWIN_EXPLANATION", "PROJECT_METHOD", "PUNE_CONTEXT"]:
            defense_txt = (
                "THESIS DEFENSE & ACADEMIC GROUNDING RULES:\n"
                "  1. Model Distinction: Acknowledge that our temporal flood engine is a high-resolution GIS-driven spatial inundation propagation architecture derived from DEM and flood extent constraints, NOT a dynamically calibrated computational hydrodynamic physics solver (like real-time 2D HEC-RAS or SWMM).\n"
                "  2. Value Proposition: 3D Digital Twin visualizes actual building extrusion heights against flood depth strata, proving far superior to static flat 2D GIS maps for rapid municipal decision-support and disaster communication.\n"
                "  3. Pune Context: Centered on the Mula-Mutha river system and Pune Municipal Corporation (PMC). Urbanization and impervious surfaces dramatically increase surface runoff, transforming low-lying river terraces into high exposure hazard zones."
            )
            context_parts.append(defense_txt)

        return "\n\n".join(context_parts)
