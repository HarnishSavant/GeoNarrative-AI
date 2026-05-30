from fastapi import APIRouter
from app.models.schemas import PredictionRequest, PredictionResponse
from app.services.prediction_service import PredictionService

router = APIRouter()

@router.post("", response_model=PredictionResponse)
async def predict_risk(request: PredictionRequest):
    """Run ML-based flood risk prediction"""
    result = PredictionService.calculate_flood_risk(request)
    return result
