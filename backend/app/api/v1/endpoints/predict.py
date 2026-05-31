from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.schemas import PredictionRequest, PredictionResponse
from app.services.prediction_service import PredictionService

router = APIRouter()

@router.post("", response_model=PredictionResponse)
async def predict_risk(
    request: PredictionRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    RUN PRACTICAL MULTI-DOMAIN GEOAI PREDICTION ENGINE:
    Trains an ensemble of Random Forest and XGBoost models, engineers advanced
    topographic/urban features, evaluates live metrics, and writes the georeferenced prediction to PostGIS.
    """
    result = await PredictionService.calculate_risk(request, db)
    return result
