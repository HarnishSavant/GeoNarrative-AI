from .analysis_engine import (
    GetFloodRisk, GetElevation, GetSlope, 
    GetDistanceToRiver, GetBuildingDensity, 
    GetLULC, GetTerrainShade
)
from .vector_manager import VectorManager
from .cache import gis_cache
from typing import Dict, Any, Optional

def get_lulc_description(code: int) -> str:
    mapping = {
        10: "Tree cover",
        20: "Shrubland",
        30: "Grassland",
        40: "Cropland",
        50: "Built-up",
        60: "Bare/sparse vegetation",
        70: "Snow and ice",
        80: "Permanent water bodies",
        90: "Herbaceous wetland",
        95: "Mangroves",
        100: "Moss and lichen"
    }
    return mapping.get(code, f"Class {code}" if code != 0 else "Unknown")

def _find_layer_by_keyword(keyword: str) -> Optional[str]:
    for name in gis_cache.vectors.keys():
        if keyword.lower() in name.lower():
            return name
    return None

def GetNearestRiver(lat: float, lon: float) -> Optional[Dict[str, Any]]:
    layer = _find_layer_by_keyword("river") or _find_layer_by_keyword("water")
    if layer:
        return VectorManager.get_nearest_feature(layer, lat, lon)
    return None

def GetNearestRoad(lat: float, lon: float) -> Optional[Dict[str, Any]]:
    layer = _find_layer_by_keyword("road") or _find_layer_by_keyword("transport")
    if layer:
        return VectorManager.get_nearest_feature(layer, lat, lon)
    return None

def GetNearestBuilding(lat: float, lon: float) -> Optional[Dict[str, Any]]:
    layer = _find_layer_by_keyword("building")
    if layer:
        return VectorManager.get_nearest_feature(layer, lat, lon)
    return None

def GetWardInformation(lat: float, lon: float) -> Optional[Dict[str, Any]]:
    layer = _find_layer_by_keyword("ward") or _find_layer_by_keyword("boundary")
    if layer:
        return VectorManager.get_containing_feature(layer, lat, lon)
    return None

def GenerateFloodReport(lat: float, lon: float) -> Dict[str, Any]:
    flood_sus = GetFloodRisk(lat, lon) or 0
    elevation = GetElevation(lat, lon) or 0
    slope = GetSlope(lat, lon) or 0
    dist_river = GetDistanceToRiver(lat, lon) or 0
    build_dens = GetBuildingDensity(lat, lon) or 0
    lulc = GetLULC(lat, lon) or 0
    
    # Vector analysis
    ward_info = GetWardInformation(lat, lon)
    nearest_river_vec = GetNearestRiver(lat, lon)
    nearest_road = GetNearestRoad(lat, lon)
    
    # Calculate simple decision support logic based on real GIS values
    risk_level = "Low"
    if flood_sus > 0.7 or (dist_river > 0 and dist_river < 500 and elevation < 600):
        risk_level = "High"
    elif flood_sus > 0.4 or (dist_river > 0 and dist_river < 1000):
        risk_level = "Medium"
        
    action = "No immediate action required."
    if risk_level == "High":
        action = "Evacuation recommended during heavy rainfall. High susceptibility zone."
    elif risk_level == "Medium":
        action = "Monitor water levels closely and prepare early warning systems."
        
    return {
        "location": {"lat": lat, "lon": lon},
        "Ward": ward_info.get("WARD_NAME", "Unknown") if ward_info else "Unknown",
        "Flood Susceptibility": round(flood_sus, 4),
        "Elevation": round(elevation, 2),
        "Slope": round(slope, 2),
        "Distance to River": round(dist_river, 2),
        "Building Density": round(build_dens, 4),
        "Land Cover": get_lulc_description(lulc),
        "Land Cover Code": lulc,
        "Nearest Road": nearest_road["distance_meters"] if nearest_road else None,
        "Risk Explanation": f"The area has a {risk_level} risk of flooding based on its elevation ({elevation:.1f}m), distance to river ({dist_river:.1f}m) and susceptibility score.",
        "Recommended Action": action
    }

def GenerateWardReport(ward_name: str) -> Dict[str, Any]:
    """
    Generates a full statistical report for a specific ward polygon.
    """
    return {
        "ward": ward_name,
        "status": "Not implemented yet. Placeholder for Polygon Statistics."
    }
