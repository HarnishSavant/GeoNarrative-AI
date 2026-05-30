from fastapi import APIRouter, Query
from app.repositories.data_store import get_flood_zones_db

router = APIRouter()

@router.get("/zones")
async def get_flood_zones(location: str = Query(default="Pune")):
    """Get flood risk zones for a location"""
    zones = get_flood_zones_db(location)
    return {"location": location, "zones": zones}
