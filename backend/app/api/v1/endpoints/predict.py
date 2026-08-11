from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.schemas import PredictionRequest, PredictionResponse
from app.services.prediction_service import PredictionService
from app.services.predictive_intelligence_service import PredictiveSpatialIntelligenceService
from app.api.v1.endpoints.auth import get_current_user
from app.models.db_models import User

router = APIRouter()

@router.get("/scenarios")
async def get_prediction_scenarios():
    """Returns scenario escalation definitions, study area metadata, and model interpretation."""
    return {"status": "success", "data": PredictiveSpatialIntelligenceService.get_all_scenarios()}

@router.get("/scenario/{scenario}")
async def get_prediction_scenario_detail(scenario: str):
    """Returns projected impacts for a specific scenario at peak progression."""
    return {"status": "success", "data": PredictiveSpatialIntelligenceService.calculate_progress_impact(scenario, 100.0)}

@router.get("/scenario/{scenario}/progress/{progress}")
async def get_prediction_scenario_progress(scenario: str, progress: float):
    """Returns temporal progression metrics and current vs next impact zone calculations."""
    return {"status": "success", "data": PredictiveSpatialIntelligenceService.calculate_progress_impact(scenario, progress)}

@router.get("/scenario/{scenario}/next-impact")
async def get_prediction_next_impact(scenario: str, progress: float = Query(50.0, description="Current scenario progression %")):
    """Returns next-asset exposure and potential expansion zone ahead of current progress."""
    return {"status": "success", "data": PredictiveSpatialIntelligenceService.calculate_progress_impact(scenario, progress)}

@router.get("/compare")
async def compare_prediction_scenarios(
    baseline: str = Query("moderate", description="Baseline flood scenario"),
    target: str = Query("heavy", description="Target flood scenario")
):
    """What-If scenario engine comparing baseline and target impact deltas."""
    return {"status": "success", "data": PredictiveSpatialIntelligenceService.compare_scenarios(baseline, target)}

@router.get("/hotspots")
async def get_prediction_hotspots():
    """Returns grid-derived emerging impact hotspots ranked by expansion and infrastructure exposure."""
    return {"status": "success", "data": PredictiveSpatialIntelligenceService.get_hotspots()}

@router.get("/location")
async def analyze_prediction_location(
    lat: float = Query(18.5204, description="Latitude inside PMC study area"),
    lon: float = Query(73.8567, description="Longitude inside PMC study area")
):
    """Location-based predictive query evaluating scenario exposure and flood arrival stage."""
    return {"status": "success", "data": PredictiveSpatialIntelligenceService.analyze_location(lat, lon)}

@router.get("/story")
async def get_prediction_story_mode():
    """Returns 5-stage chronological predictive narrative for thesis defense demonstration."""
    return {"status": "success", "data": PredictiveSpatialIntelligenceService.get_prediction_story()}

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

