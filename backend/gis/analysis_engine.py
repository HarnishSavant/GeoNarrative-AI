from .raster_manager import RasterManager
import math

def GetElevation(lat: float, lon: float) -> float:
    val = RasterManager.get_pixel_value("dem", lat, lon)
    return float(val) if val is not None else 0.0

def GetSlope(lat: float, lon: float) -> float:
    val = RasterManager.get_pixel_value("slope", lat, lon)
    return float(val) if val is not None else 0.0

def GetFloodRisk(lat: float, lon: float) -> float:
    val = RasterManager.get_pixel_value("flood", lat, lon)
    return float(val) if val is not None else 0.0

def GetDistanceToRiver(lat: float, lon: float) -> float:
    val = RasterManager.get_pixel_value("dist_to_river", lat, lon)
    return float(val) if val is not None else 0.0

def GetBuildingDensity(lat: float, lon: float) -> float:
    val = RasterManager.get_pixel_value("builddens", lat, lon)
    return float(val) if val is not None else 0.0

def GetLULC(lat: float, lon: float) -> int:
    val = RasterManager.get_pixel_value("lulcc", lat, lon)
    if val is not None:
        if math.isnan(val):
            return 0
        return int(val)
    return 0

def GetTerrainShade(lat: float, lon: float) -> float:
    val = RasterManager.get_pixel_value("hill", lat, lon)
    return float(val) if val is not None else 0.0
