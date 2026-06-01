from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.schemas import PredictionRequest, PredictionResponse
from app.services.prediction_service import PredictionService
from app.api.v1.endpoints.auth import get_current_user
from app.models.db_models import User

router = APIRouter()

@router.post("", response_model=PredictionResponse)
async def predict_risk(
    request: PredictionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    RUN PRACTICAL MULTI-DOMAIN GEOAI PREDICTION ENGINE:
    Trains an ensemble of Random Forest and XGBoost models, engineers advanced
    topographic/urban features, evaluates live metrics, and writes the georeferenced prediction to PostGIS.
    """
    result = await PredictionService.calculate_risk(request, db)
    return result
