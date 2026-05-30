from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.database_service import DatabaseService
from app.services.spatial_query_service import SpatialQueryService
from app.services.osm_service import OSMService
from app.services.gis_engine import GISEngine
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

router = APIRouter()

# --- REQUEST SCHEMAS ---

class InfrastructureNodeCreate(BaseModel):
    name: str
    type: str # hospital, substation, pump_station, etc.
    status: str = "active"
    longitude: float
    latitude: float

class FloodZoneCreate(BaseModel):
    name: str
    risk_level: str # low, medium, high, critical
    inundation_depth: float
    multipolygon_wkt: str # e.g. "MULTIPOLYGON(((73.85 18.52, 73.86 18.52, 73.86 18.53, 73.85 18.53, 73.85 18.52)))"

class ChatHistoryLog(BaseModel):
    role: str # user or assistant
    content: str
    metadata: Optional[Dict[str, Any]] = None

# --- ENDPOINTS ---

@router.post("/infrastructure", response_model=Dict[str, Any])
async def add_infrastructure(
    payload: InfrastructureNodeCreate,
    db: AsyncSession = Depends(get_db)
):
    """Add a point infrastructure asset to the active Digital Twin database"""
    try:
        node = await DatabaseService.add_infrastructure(
            db, payload.name, payload.type, payload.status, payload.longitude, payload.latitude
        )
        return node
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Database insertion failed: {str(e)}")


@router.post("/flood-zone", response_model=Dict[str, Any])
async def add_flood_zone(
    payload: FloodZoneCreate,
    db: AsyncSession = Depends(get_db)
):
    """Add a flood zone polygon boundary to the PostGIS spatial catalog"""
    try:
        zone = await DatabaseService.add_flood_zone(
            db, payload.name, payload.risk_level, payload.inundation_depth, payload.multipolygon_wkt
        )
        return zone
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PostGIS MultiPolygon parsing failed: {str(e)}")


@router.get("/hospitals-in-flood", response_model=List[Dict[str, Any]])
async def get_hospitals_in_flood_zones(
    db: AsyncSession = Depends(get_db)
):
    """
    GEOSPATIAL QUERY 1: Hospitals inside flood zones.
    Runs ST_Contains using GIST spatial indexes.
    """
    try:
        matches = await SpatialQueryService.query_hospitals_in_flood_zones(db)
        return matches
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Geospatial query failed: {str(e)}")


@router.get("/schools-near-rivers", response_model=List[Dict[str, Any]])
async def get_schools_near_rivers(
    distance_m: float = Query(500.0, description="Proximity distance in meters"),
    db: AsyncSession = Depends(get_db)
):
    """
    GEOSPATIAL QUERY 2: Schools within X meters of river channels.
    Runs ST_Distance from geodetic WKT lines.
    """
    try:
        matches = await SpatialQueryService.query_schools_near_rivers(db, distance_m)
        return matches
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"River distance search failed: {str(e)}")


@router.get("/nearest-shelters", response_model=List[Dict[str, Any]])
async def get_nearest_shelters(
    lng: float = Query(..., description="Longitude of search origin"),
    lat: float = Query(..., description="Latitude of search origin"),
    limit: int = Query(3, ge=1, le=10, description="Max shelters to return"),
    db: AsyncSession = Depends(get_db)
):
    """
    GEOSPATIAL QUERY 3: Find nearest emergency shelters.
    Uses PostGIS KNN `<->` index operators.
    """
    try:
        shelters = await SpatialQueryService.query_nearest_shelters(db, lng, lat, limit)
        return shelters
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"KNN shelter search failed: {str(e)}")


@router.get("/nearest-infrastructure", response_model=List[Dict[str, Any]])
async def get_nearest_infrastructure(
    lng: float = Query(..., description="WGS84 Longitude of search point"),
    lat: float = Query(..., description="WGS84 Latitude of search point"),
    limit: int = Query(5, ge=1, le=50, description="Max nearest records to return"),
    db: AsyncSession = Depends(get_db)
):
    """
    GEOSPATIAL QUERY: KNN closest infrastructure search.
    Utilizes PostGIS '<->' operator for high speed.
    """
    try:
        nearest = await DatabaseService.get_nearest_assets(db, lng, lat, limit)
        return nearest
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"KNN spatial search failed: {str(e)}")


@router.get("/buffer-analysis", response_model=List[Dict[str, Any]])
async def run_buffer_analysis(
    lng: float = Query(..., description="Buffer center WGS84 Longitude"),
    lat: float = Query(..., description="Buffer center WGS84 Latitude"),
    radius_km: float = Query(..., ge=0.1, le=100.0, description="Radial distance in kilometers"),
    db: AsyncSession = Depends(get_db)
):
    """
    GEOSPATIAL QUERY: Find assets inside radial buffer boundary.
    Utilizes ST_DWithin on coordinate columns.
    """
    try:
        assets = await DatabaseService.run_radial_buffer(db, lng, lat, radius_km)
        return assets
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Spatial buffer query failed: {str(e)}")


@router.get("/high-risk-infrastructure", response_model=List[Dict[str, Any]])
async def get_high_risk_infrastructure(
    db: AsyncSession = Depends(get_db)
):
    """
    GEOSPATIAL QUERY 4: Identify all high-risk infrastructure nodes inside critical floodways.
    Uses ST_Contains filtering by risk level.
    """
    try:
        records = await SpatialQueryService.query_high_risk_infrastructure(db)
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"High risk spatial join failed: {str(e)}")


@router.get("/buildings-intersecting-vulnerable", response_model=List[Dict[str, Any]])
async def get_buildings_intersecting_vulnerable(
    db: AsyncSession = Depends(get_db)
):
    """
    GEOSPATIAL QUERY 5: Mapped buildings intersecting critical hazard zones.
    Uses ST_Intersects overlay analysis.
    """
    try:
        records = await SpatialQueryService.query_buildings_intersecting_vulnerable_areas(db)
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Building intersection overlay query failed: {str(e)}")


@router.get("/flood-prone-roads", response_model=List[Dict[str, Any]])
async def get_flood_prone_roads(
    db: AsyncSession = Depends(get_db)
):
    """
    GEOSPATIAL QUERY 6: Identify flood-prone road corridors.
    Runs ST_Intersects between road lines WKT and floodways.
    """
    try:
        roads = await SpatialQueryService.query_flood_prone_roads(db)
        return roads
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prone roads intersection query failed: {str(e)}")


@router.get("/mode-metrics", response_model=Dict[str, Any])
async def get_mode_metrics(
    mode: str = Query(..., description="Twin Mode: flood, traffic, urban, utility"),
    db: AsyncSession = Depends(get_db)
):
    """
    DYNAMIC TWIN MODE Spatial Query Pipeline:
    Returns full lists of affected features, metrics, and actionable recommendations.
    """
    try:
        analysis = await SpatialQueryService.execute_mode_analysis(db, mode)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mode spatial analysis execution failed: {str(e)}")


@router.post("/chat-history", response_model=Dict[str, Any])
async def log_chat_history(
    payload: ChatHistoryLog,
    db: AsyncSession = Depends(get_db)
):
    """Log a conversational chat history exchange to the database"""
    try:
        record = await DatabaseService.log_chat(db, payload.role, payload.content, payload.metadata)
        return record
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat recording failed: {str(e)}")


@router.get("/chat-history", response_model=List[Dict[str, Any]])
async def get_chat_history(
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve historical conversational RAG records"""
    try:
        records = await DatabaseService.get_chats(db, limit)
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch chat logs: {str(e)}")


# --- REAL GEOSPATIAL ANALYSIS INTEGRATIONS ---

class GISAnalysisRequest(BaseModel):
    city: str
    mode: str  # flood, traffic, urban, utility
    lat_min: float
    lat_max: float
    lon_min: float
    lon_max: float
    parameter_value: float = 120.0 # rainfall or buffer radius

@router.post("/analysis", response_model=Dict[str, Any])
async def run_live_gis_analysis(
    payload: GISAnalysisRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    RUN LIVE GIS ANALYSIS PIPELINE:
    Downloads real-time OSM topological vectors from Overpass,
    feeds them directly into the high-performance Shapely GISEngine,
    calculates real-time buffer boundaries, spatial joins, and vulnerability MCE overlays,
    and automatically records telemetry outputs to local PostgreSQL database.
    """
    bbox = {
        "lat_min": payload.lat_min,
        "lat_max": payload.lat_max,
        "lon_min": payload.lon_min,
        "lon_max": payload.lon_max
    }
    
    city = payload.city
    mode = payload.mode
    val = payload.parameter_value

    try:
        if mode == "flood":
            # Ingest live channels, structures, and facilities
            hospitals = await OSMService.fetch_osm_features(city, "hospitals", bbox)
            rivers = await OSMService.fetch_osm_features(city, "rivers", bbox)
            buildings = await OSMService.fetch_osm_features(city, "buildings", bbox)
            
            # Execute Vector/Raster Multi-Criteria Vulnerability Evaluation
            results = GISEngine.analyze_flood_vulnerability(hospitals, rivers, buildings, rainfall_intensity=val)
            
            # Persist summary metric to PostgreSQL PostGIS database
            await DatabaseService.track_metric(db, city, "flood_vulnerable_facilities", float(len(results["vulnerable_assets"])))
            return results

        elif mode == "traffic":
            roads = await OSMService.fetch_osm_features(city, "roads", bbox)
            schools = await OSMService.fetch_osm_features(city, "schools", bbox)
            
            # Execute road segments spatial buffer overlap
            results = GISEngine.analyze_traffic_corridors(roads, schools)
            await DatabaseService.track_metric(db, city, "clogged_road_segments", float(results["summary"]["clogged_segments"]))
            return results

        elif mode == "urban":
            hospitals = await OSMService.fetch_osm_features(city, "hospitals", bbox)
            buildings = await OSMService.fetch_osm_features(city, "buildings", bbox)
            
            # Execute Zoning compliance spatial join overlay
            results = GISEngine.audit_urban_zoning(hospitals, buildings)
            await DatabaseService.track_metric(db, city, "urban_zoning_violations", float(results["summary"]["zoning_violations_identified"]))
            return results

        elif mode == "utility":
            hospitals = await OSMService.fetch_osm_features(city, "hospitals", bbox)
            infra = await OSMService.fetch_osm_features(city, "infrastructure", bbox)
            
            # Execute Substation coverage buffering isolation audit
            results = GISEngine.audit_grid_coverage(infra, hospitals)
            await DatabaseService.track_metric(db, city, "isolated_consumers", float(results["summary"]["isolated_consumers"]))
            return results
            
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported analysis mode: {mode}")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GIS Analysis pipeline execution failed: {str(e)}")
