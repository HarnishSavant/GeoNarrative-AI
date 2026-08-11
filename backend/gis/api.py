from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import JSONResponse
from .services import GenerateFloodReport
from .statistics import get_dashboard_statistics
from .analysis_engine import GetFloodRisk
from .cache import gis_cache
from .raster_manager import RasterManager
from .flood_grid_service import generate_flood_grid
import json
import logging

logger = logging.getLogger("gis_api")

router = APIRouter()

# ============================================================================
# Cache for the flood grid (computed once, served many times)
# ============================================================================
_flood_grid_cache: dict = {}

@router.get("/location-analysis")
async def location_analysis(lat: float = Query(...), lon: float = Query(...)):
    """
    Perform a full location analysis using the GIS Data Manager and Decision Engine.
    """
    try:
        report = GenerateFloodReport(lat, lon)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/flood-risk")
async def flood_risk(lat: float = Query(...), lon: float = Query(...)):
    """
    Get just the flood risk score for a specific lat/lon.
    """
    try:
        risk = GetFloodRisk(lat, lon)
        return {"lat": lat, "lon": lon, "flood_risk": risk}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard-statistics")
async def dashboard_statistics():
    """
    Get overall GIS dashboard statistics including loaded rasters.
    """
    return get_dashboard_statistics()

@router.get("/raster-information")
async def raster_information():
    """
    Get detailed information about each cached raster (CRS, bounds, nodata, etc).
    """
    info = []
    for name in gis_cache.rasters.keys():
        info.append(RasterManager.get_info(name))
    return {"rasters": info}

@router.get("/vector/{name}/geojson")
async def get_vector_geojson(name: str):
    """
    Returns the cached vector layer as GeoJSON for frontend rendering.
    """
    gdf = gis_cache.vectors.get(name)
    if gdf is None:
        raise HTTPException(status_code=404, detail="Vector layer not found")
        
    try:
        # Convert to GeoJSON, replacing NaN with None to ensure valid JSON
        geojson_str = gdf.to_json(drop_id=True)
        return json.loads(geojson_str)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# FLOOD SIMULATION ENDPOINTS
# ============================================================================

@router.get("/flood-simulation/grid")
async def get_flood_simulation_grid():
    """
    Returns the precomputed flood simulation grid.
    The grid is generated from real GIS rasters (DEM, slope, distance-to-river,
    flood susceptibility, LULC, building density) and cached server-side.
    
    Each cell contains:
    - i: flat index
    - r, c: row/col
    - lon, lat: center coordinates
    - elev: terrain elevation (m)
    - slope: terrain gradient
    - dtr: distance to nearest river (m)
    - sus: flood susceptibility score (0-1)
    - susClass: VERY_HIGH | HIGH | MODERATE | LOW | VERY_LOW
    - lulc: land use/land cover class
    - bdens: building density
    - seed: whether this cell is a river seed
    """
    global _flood_grid_cache
    
    try:
        if not _flood_grid_cache:
            logger.info("Computing flood simulation grid (first request)...")
            _flood_grid_cache = generate_flood_grid()
            logger.info(f"Flood grid cached: {_flood_grid_cache['metadata']['totalCells']} cells")
        
        return JSONResponse(content=_flood_grid_cache)
    except Exception as e:
        logger.error(f"Failed to generate flood grid: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/flood-simulation/waterways")
async def get_waterways_geojson():
    """
    Returns the river/waterway network as GeoJSON for Cesium rendering.
    Searches for vector layers with 'water' in their name.
    """
    # Try to find waterway layers
    water_layer = None
    for name in gis_cache.vectors.keys():
        if "water_way" in name.lower() or "waterway" in name.lower():
            water_layer = name
            break
    
    if water_layer is None:
        for name in gis_cache.vectors.keys():
            if "water" in name.lower():
                water_layer = name
                break
    
    if water_layer is None:
        raise HTTPException(status_code=404, detail="No waterway vector layer found in geodatabase")
    
    try:
        gdf = gis_cache.vectors[water_layer]
        geojson_str = gdf.to_json(drop_id=True)
        return json.loads(geojson_str)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
