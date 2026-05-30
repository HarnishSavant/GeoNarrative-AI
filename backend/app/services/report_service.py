import random
from datetime import datetime
from app.models.schemas import ReportRequest

class ReportService:
    @staticmethod
    def generate_pdf_report(request: ReportRequest) -> dict:
        report_id = str(int(datetime.now().timestamp() * 1000))
        
        return {
            "id": report_id,
            "title": f"GeoAI Risk Assessment — {request.location}",
            "location": request.location,
            "generated_at": datetime.now().isoformat(),
            "risk_level": "high",
            "pages": random.randint(15, 35),
            "summary": f"Comprehensive flood risk assessment for {request.location} reveals moderate to high risk levels across 4 identified zones. "
                       f"Critical infrastructure including 8 hospitals and 42 schools require immediate attention. "
                       f"Rainfall anomaly of +18.3% above 10-year average increases seasonal flood probability by 23%.",
            "sections": [
                {
                    "title": "Executive Summary",
                    "content": f"This report presents a comprehensive geospatial risk assessment for {request.location}, "
                              f"utilizing multi-factor analysis including rainfall patterns, elevation data, land use, "
                              f"drainage infrastructure, and population density.",
                },
                {
                    "title": "Risk Zone Analysis",
                    "content": "Four distinct risk zones have been identified ranging from Low to Critical risk levels. "
                              "The Riverside District shows the highest vulnerability with a risk score of 9.2/10.",
                },
                {
                    "title": "Infrastructure Impact",
                    "content": "Analysis reveals 8 hospitals, 42 schools, and 4 water treatment plants within high-risk flood zones. "
                              "Emergency preparedness upgrades are recommended for all critical facilities.",
                },
                {
                    "title": "Mitigation Recommendations",
                    "content": "15 actionable mitigation strategies have been identified across immediate, short-term, and long-term timeframes. "
                              "Expected overall risk reduction: 65% within 3 years.",
                },
            ],
        }
