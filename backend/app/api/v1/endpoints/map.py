from fastapi import APIRouter, Query, Depends
from app.repositories.data_store import get_map_layers_db
from app.services.spatial_service import SpatialService
from app.api.v1.endpoints.auth import get_current_user
from app.models.db_models import User

router = APIRouter()

@router.get("/layers")
async def get_map_layers(current_user: User = Depends(get_current_user)):
    """Get available map layers"""
    return get_map_layers_db()

@router.get("/geojson")
async def get_geojson(
    center_lng: float = Query(default=73.8567),
    center_lat: float = Query(default=18.5204),
    layer: str = Query(default="risk-points"),
    count: int = Query(default=100, ge=1, le=500),
    current_user: User = Depends(get_current_user)
):
    """Generate GeoJSON data for map layers"""
    return SpatialService.generate_random_geojson(center_lng, center_lat, layer, count)
