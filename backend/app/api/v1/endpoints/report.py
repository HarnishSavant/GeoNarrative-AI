from fastapi import APIRouter, Depends
from app.models.schemas import ReportRequest, ReportResponse
from app.services.report_service import ReportService
from app.api.v1.endpoints.auth import get_current_user
from app.models.db_models import User

router = APIRouter()

@router.post("/generate", response_model=ReportResponse)
async def generate_report(
    request: ReportRequest,
    current_user: User = Depends(get_current_user)
):
    """Generate an AI-powered risk assessment report"""
    result = ReportService.generate_pdf_report(request)
    return result
