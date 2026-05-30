from fastapi import APIRouter
from app.models.schemas import ReportRequest, ReportResponse
from app.services.report_service import ReportService

router = APIRouter()

@router.post("/generate", response_model=ReportResponse)
async def generate_report(request: ReportRequest):
    """Generate an AI-powered risk assessment report"""
    result = ReportService.generate_pdf_report(request)
    return result
