from fastapi import APIRouter, Query, Depends
from app.services.weather_service import WeatherService
from app.api.v1.endpoints.auth import get_current_user
from app.models.db_models import User

router = APIRouter()

@router.get("")
async def get_weather(
    lat: float = Query(default=18.5204, description="Latitude"),
    lon: float = Query(default=73.8567, description="Longitude"),
    location: str = Query(default="Pune", description="Location name"),
    current_user: User = Depends(get_current_user)
):
    """Get live weather data from OpenWeatherMap API"""
    result = await WeatherService.get_live_weather(lat, lon, location)
    return result
