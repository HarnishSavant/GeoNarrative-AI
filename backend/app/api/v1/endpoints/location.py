"""
GeoNarrative AI — Geocoding & OpenStreetMap GIS Integration API
Secured via secure JWT bearer authentication.
"""
from fastapi import APIRouter, Query, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.osm_service import OSMService
from app.api.v1.endpoints.auth import get_current_user
from app.models.db_models import User
from typing import Dict, Any, List

router = APIRouter()

@router.get("/search")
async def search_location(
    q: str = Query(..., description="Geocode location name using Nominatim"),
    current_user: User = Depends(get_current_user)
):
    """
    DYNAMIC GEOCODING API:
    Queries OpenStreetMap Nominatim for the searched city.
    Returns latitude, longitude, and bounding box.
    """
    result = await OSMService.geocode_city(q)
    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"Location '{q}' could not be geocoded. Please enter a valid city name."
        )
    return result

@router.get("/osm", response_model=Dict[str, Any])
async def fetch_osm_layers(
    city: str = Query(..., description="Target city name"),
    category: str = Query("roads", description="roads, rivers, hospitals, schools, buildings, infrastructure"),
    lat_min: float = Query(..., description="Bounding box min latitude"),
    lat_max: float = Query(..., description="Bounding box max latitude"),
    lon_min: float = Query(..., description="Bounding box min longitude"),
    lon_max: float = Query(..., description="Bounding box max longitude"),
    current_user: User = Depends(get_current_user)
):
    """
    DYNAMIC GIS EXTRACTION API:
    Queries OpenStreetMap Overpass API for active structural layers
    within the geocoded city bounding box. Converts results to GeoJSON.
    """
    bbox = {
        "lat_min": lat_min,
        "lat_max": lat_max,
        "lon_min": lon_min,
        "lon_max": lon_max
    }
    try:
        geojson = await OSMService.fetch_osm_features(city, category, bbox)
        return geojson
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Overpass parsing failed: {str(e)}")

@router.post("/osm/persist", response_model=Dict[str, Any])
async def persist_osm_layers(
    city: str = Query(..., description="City name to import"),
    category: str = Query("hospitals", description="hospitals, schools, infrastructure"),
    lat_min: float = Query(..., description="Bounding box min latitude"),
    lat_max: float = Query(..., description="Bounding box max latitude"),
    lon_min: float = Query(..., description="Bounding box min longitude"),
    lon_max: float = Query(..., description="Bounding box max longitude"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    DYNAMIC DATABASE PERSISTENCE API:
    Fetches real OSM data and writes it directly to PostgreSQL PostGIS spatial tables.
    """
    bbox = {
        "lat_min": lat_min,
        "lat_max": lat_max,
        "lon_min": lon_min,
        "lon_max": lon_max
    }
    try:
        geojson = await OSMService.fetch_osm_features(city, category, bbox)
        count = await OSMService.persist_osm_to_db(db, geojson, city)
        return {
            "status": "success",
            "city": city,
            "category": category,
            "records_persisted": count,
            "message": f"Successfully loaded and persisted {count} real features into PostGIS spatial layers."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to persist spatial layers: {str(e)}")
