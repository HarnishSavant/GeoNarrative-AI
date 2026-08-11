from fastapi import APIRouter, Depends
from app.models.schemas import ReportRequest, ReportResponse
from app.services.report_service import ReportService
from app.services.report_agent import ReportAgentService
from app.services.report_aggregation_service import ReportAggregationService
from app.api.v1.endpoints.auth import get_current_user
from app.models.db_models import User
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()

@router.post("/generate", response_model=ReportResponse)
async def generate_report(
    request: ReportRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate an AI-powered risk assessment or Phase 9 analytical report"""
    analytical_types = {"current_analysis", "flood_scenario", "prediction", "infrastructure_impact", "complete_analysis"}
    if request.report_type in analytical_types or ("pune" in request.location.lower() and request.report_type != "comprehensive"):
        return await ReportAggregationService.generate_analytical_report(request, current_user, db)
    elif request.report_type == "comprehensive":
        return await ReportAgentService.generate_agent_report(request, current_user, db)
    else:
        return await ReportService.generate_pdf_report(request, current_user, db)
