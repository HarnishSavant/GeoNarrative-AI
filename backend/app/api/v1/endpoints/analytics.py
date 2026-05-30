from fastapi import APIRouter, Query
from app.repositories.data_store import get_analytics_data_db, get_kpis_db
from app.models.schemas import AnalyticsResponse, KPIResponse

router = APIRouter()

@router.get("", response_model=AnalyticsResponse)
async def get_analytics(location: str = Query(default="Pune")):
    """Get analytics data for a location"""
    data = get_analytics_data_db(location)
    return data

@router.get("/kpi", response_model=KPIResponse)
async def get_kpis(location: str = Query(default="Pune")):
    """Get KPI data for a location"""
    data = get_kpis_db(location)
    return data
