import logging
from typing import Dict, Any, List

logger = logging.getLogger("geonarrative.geo_reasoning_engine")

class GeoReasoningEngine:
    """
    Enterprise Spatial Knowledge Graph and Reasoning Engine.
    Converts raw PostGIS spatial intersections into professional, 
    consulting-grade actionable intelligence WITHOUT requiring an LLM.
    """

    @staticmethod
    def generate_intelligence(domain: str, spatial_data: Dict[str, Any], available_layers: List[str]) -> Dict[str, Any]:
        """
        Routes the raw spatial data to the appropriate Domain Intelligence Module.
        """
        confidence = GeoReasoningEngine._calculate_confidence(available_layers, spatial_data)

        if domain.upper() == "FLOOD":
            analysis = FloodIntelligenceEngine.analyze(spatial_data)
        elif domain.upper() == "TRAFFIC":
            analysis = TrafficIntelligenceEngine.analyze(spatial_data)
        elif domain.upper() == "URBAN":
            analysis = UrbanIntelligenceEngine.analyze(spatial_data)
        elif domain.upper() == "UTILITY":
            analysis = UtilityIntelligenceEngine.analyze(spatial_data)
        else:
            analysis = {
                "overall_risk": "Unknown",
                "findings": ["General spatial analysis complete."],
                "recommendations": ["Review underlying map layers for visual confirmation."]
            }

        return {
            "title": f"{domain.capitalize()} Exposure Assessment",
            "overall_risk": analysis.get("overall_risk", "Moderate"),
            "key_findings": analysis.get("findings", []),
            "recommendations": analysis.get("recommendations", []),
            "confidence_score": f"{confidence}%",
            "sources": ["✓ PostGIS Spatial Engine", "✓ OpenStreetMap Vector Graph"],
            "missing_layers": GeoReasoningEngine._identify_missing_layers(available_layers, domain)
        }

    @staticmethod
    def format_as_markdown(reasoning_result: Dict[str, Any]) -> str:
        """
        Formats the reasoning dictionary into a highly professional consulting-grade markdown report.
        """
        md = f"### {reasoning_result.get('title', 'Spatial Assessment')}\n\n"
        md += f"**Overall Risk:** {reasoning_result.get('overall_risk', 'Unknown')}\n\n"
        
        md += "**Key Findings:**\n"
        for finding in reasoning_result.get("key_findings", []):
            md += f"• {finding}\n"
        
        md += "\n**Recommendations:**\n"
        for rec in reasoning_result.get("recommendations", []):
            md += f"• {rec}\n"
            
        md += "\n---\n**Data Provenance & Confidence**\n"
        md += f"*Confidence Score:* {reasoning_result.get('confidence_score', '0%')}\n\n"
        
        md += "*Sources Used:*\n"
        for source in reasoning_result.get("sources", []):
            md += f"{source}\n"
            
        missing = reasoning_result.get("missing_layers", [])
        if missing:
            md += "\n*Missing Layers (Reduced Confidence):*\n"
            for m in missing:
                md += f"✗ {m}\n"
                
        return md

    @staticmethod
    def _calculate_confidence(layers: List[str], data: Dict[str, Any]) -> int:
        base_confidence = 70
        if "buildings" in layers: base_confidence += 5
        if "roads" in layers: base_confidence += 5
        if "rivers" in layers: base_confidence += 5
        if "hospitals" in layers: base_confidence += 5
        
        # If the database actually returned rows, confidence is higher
        has_data = any(len(v) > 0 for k, v in data.items() if isinstance(v, list))
        if has_data:
            base_confidence += 10
            
        return min(base_confidence, 98)

    @staticmethod
    def _identify_missing_layers(layers: List[str], domain: str) -> List[str]:
        missing = []
        if domain.upper() == "FLOOD":
            if "rivers" not in layers: missing.append("Hydrological Network (Rivers)")
            missing.append("High-Res DEM (Digital Elevation Model)")
            missing.append("Live Rainfall Raster")
        elif domain.upper() == "TRAFFIC":
            if "roads" not in layers: missing.append("Road Network Graph")
            missing.append("Live TomTom/HERE Traffic API")
        elif domain.upper() == "UTILITY":
            if "infrastructure" not in layers: missing.append("Power Substation Nodes")
            missing.append("Underground Cable Network")
        return missing


class FloodIntelligenceEngine:
    @staticmethod
    def analyze(data: Dict[str, Any]) -> Dict[str, Any]:
        hospitals_at_risk = data.get("hospitals_in_flood_zones", [])
        schools_near_rivers = data.get("schools_near_rivers", [])
        flood_corridors = data.get("flood_corridors", [])
        
        findings = []
        recommendations = []
        risk_score = 0
        
        if len(hospitals_at_risk) > 0:
            findings.append(f"{len(hospitals_at_risk)} healthcare facilities located strictly within defined flood inundation zones.")
            recommendations.append("Deploy portable emergency power generators to identified high-risk healthcare facilities.")
            recommendations.append("Establish elevated evacuation corridors for critical patients.")
            risk_score += 3
            
        if len(schools_near_rivers) > 0:
            findings.append(f"{len(schools_near_rivers)} educational facilities detected within a 500m proximity to major hydrological features.")
            recommendations.append("Implement automated SMS early-warning system for vulnerable school districts.")
            risk_score += 2
            
        if len(flood_corridors) > 0:
            findings.append(f"{len(flood_corridors)} critical road corridors show high susceptibility to monsoon inundation.")
            recommendations.append("Install permanent stormwater drainage pumps at identified road depression points.")
            risk_score += 2
            
        if len(findings) == 0:
            findings.append("No critical infrastructure explicitly detected within modeled inundation boundaries.")
            recommendations.append("Maintain standard seasonal monitoring protocols.")
            risk_level = "Low"
        elif risk_score >= 5:
            risk_level = "Critical"
        elif risk_score >= 3:
            risk_level = "High"
        else:
            risk_level = "Moderate"
            
        return {
            "overall_risk": risk_level,
            "findings": findings,
            "recommendations": recommendations
        }


class TrafficIntelligenceEngine:
    @staticmethod
    def analyze(data: Dict[str, Any]) -> Dict[str, Any]:
        road_corridors = data.get("flood_corridors", []) 
        
        findings = []
        recommendations = []
        risk_score = 0
        
        if len(road_corridors) > 0:
            findings.append(f"{len(road_corridors)} primary arterial routes intersect with vulnerability zones, threatening network throughput.")
            recommendations.append("Reroute heavy logistics traffic through elevated secondary highways.")
            risk_score += 3
            
        if risk_score == 0:
            findings.append("Arterial network appears resilient under current simulated conditions.")
            recommendations.append("Optimize traffic signal timing during peak hours.")
            risk_level = "Low"
        else:
            risk_level = "High"
            
        return {
            "overall_risk": risk_level,
            "findings": findings,
            "recommendations": recommendations
        }


class UrbanIntelligenceEngine:
    @staticmethod
    def analyze(data: Dict[str, Any]) -> Dict[str, Any]:
        vulnerable_buildings = data.get("vulnerable_buildings", [])
        
        findings = []
        recommendations = []
        
        if len(vulnerable_buildings) > 0:
            findings.append(f"Spatial join indicates {len(vulnerable_buildings)} residential/commercial structures intersect high-risk zones.")
            recommendations.append("Enforce strict zoning laws preventing new ground-level development in identified sectors.")
            risk_level = "High"
        else:
            findings.append("Urban density safely isolated from immediate geohazards.")
            recommendations.append("Approve planned expansion permits.")
            risk_level = "Low"
            
        return {
            "overall_risk": risk_level,
            "findings": findings,
            "recommendations": recommendations
        }


class UtilityIntelligenceEngine:
    @staticmethod
    def analyze(data: Dict[str, Any]) -> Dict[str, Any]:
        high_risk_infra = data.get("high_risk_infrastructure", [])
        
        findings = []
        recommendations = []
        
        if len(high_risk_infra) > 0:
            findings.append(f"{len(high_risk_infra)} critical utility nodes (substations, telecom) geographically exposed to disruption.")
            recommendations.append("Harden base-station infrastructure; elevate electrical relays by minimum 1.5m.")
            risk_level = "Critical"
        else:
            findings.append("Utility distribution network topology is outside projected impact zones.")
            recommendations.append("Proceed with standard scheduled maintenance.")
            risk_level = "Low"
            
        return {
            "overall_risk": risk_level,
            "findings": findings,
            "recommendations": recommendations
        }
