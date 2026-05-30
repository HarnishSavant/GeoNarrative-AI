from fastapi import APIRouter
from app.api.v1.endpoints import (
    location,
    upload,
    analytics,
    flood,
    map,
    chat,
    predict,
    report,
    weather,
    gis_db,
)

api_router = APIRouter()

api_router.include_router(location.router, prefix="/locations", tags=["locations"])
api_router.include_router(upload.router, prefix="/upload", tags=["upload"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(flood.router, prefix="/flood", tags=["flood"])
api_router.include_router(map.router, prefix="/map", tags=["map"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(predict.router, prefix="/predict", tags=["prediction"])
api_router.include_router(report.router, prefix="/reports", tags=["reports"])
api_router.include_router(weather.router, prefix="/weather", tags=["weather"])
api_router.include_router(gis_db.router, prefix="/gis", tags=["geospatial-database"])

