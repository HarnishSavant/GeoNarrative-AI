from fastapi import APIRouter, Query
from app.services.weather_service import WeatherService

router = APIRouter()

@router.get("")
async def get_weather(
    lat: float = Query(default=18.5204, description="Latitude"),
    lon: float = Query(default=73.8567, description="Longitude"),
    location: str = Query(default="Pune", description="Location name"),
):
    """Get live weather data from OpenWeatherMap API"""
    result = await WeatherService.get_live_weather(lat, lon, location)
    return result
