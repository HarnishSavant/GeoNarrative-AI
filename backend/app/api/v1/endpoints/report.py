from fastapi import APIRouter, Depends
from app.models.schemas import ReportRequest, ReportResponse
from app.services.report_agent import ReportAgentService
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
    """Generate an AI-powered risk assessment report"""
    result = await ReportAgentService.generate_agent_report(request, current_user, db)
    return result

