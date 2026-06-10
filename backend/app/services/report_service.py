import json
import base64
import logging
from datetime import datetime
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor

from sqlalchemy.ext.asyncio import AsyncSession
from app.models.schemas import ReportRequest
from app.models.db_models import User, ActivityLog, Report
from app.services.geoai_orchestrator import GeoAIOrchestrator

logger = logging.getLogger("geonarrative.report_service")

class ReportService:
    @staticmethod
    async def generate_pdf_report(request: ReportRequest, current_user: User, db: AsyncSession) -> dict:
        report_id = str(int(datetime.now().timestamp() * 1000))
        
        # 1. Ask Gemini to generate report sections
        system_instruction = f"""You are a Senior Geospatial Intelligence Analyst for GeoNarrative AI.
Write a professional, consulting-grade intelligence report for {request.location}.
The report type is '{request.report_type}'.
The tone must be like a Deloitte consulting report, Urban Planning report, or Government intelligence report.

Your output must be VALID JSON with exactly this structure:
{{
  "risk_level": "low|medium|high|critical",
  "summary": "2-3 sentences executive summary",
  "sections": [
    {{
      "title": "Executive Summary",
      "content": "Detailed content..."
    }},
    {{
      "title": "Flood Risk Assessment",
      "content": "Detailed content..."
    }},
    {{
      "title": "Traffic Intelligence",
      "content": "Detailed content..."
    }},
    {{
      "title": "Urban Development Intelligence",
      "content": "Detailed content..."
    }},
    {{
      "title": "Utility Infrastructure Intelligence",
      "content": "Detailed content..."
    }},
    {{
      "title": "Key Risks & Opportunities",
      "content": "Detailed content..."
    }},
    {{
      "title": "Recommendations",
      "content": "Detailed content..."
    }},
    {{
      "title": "Conclusion",
      "content": "Detailed content..."
    }}
  ]
}}
DO NOT INCLUDE ANY MARKDOWN CODE BLOCKS like ```json. ONLY return the raw JSON object. Ensure all quotes are properly escaped."""

        gemini_prompt = f"Please generate the '{request.report_type}' report for {request.location} based on standard metrics."
        
        try:
            logger.info(f"Generating AI Report for {request.location} with Gemini")
            llm_reply = await GeoAIOrchestrator.call_llm(
                contents=[{"role": "user", "content": gemini_prompt}],
                system_instruction=system_instruction
            )
            
            # Clean possible markdown formatting
            llm_reply = llm_reply.strip()
            if llm_reply.startswith("```json"):
                llm_reply = llm_reply[7:]
            if llm_reply.startswith("```"):
                llm_reply = llm_reply[3:]
            if llm_reply.endswith("```"):
                llm_reply = llm_reply[:-3]
            llm_reply = llm_reply.strip()
            
            report_data = json.loads(llm_reply)
        except Exception as e:
            logger.error(f"Failed to generate report from Gemini: {e}")
            # Fallback data if Gemini fails
            report_data = {
                "risk_level": "medium",
                "summary": f"Could not complete full AI analysis for {request.location} due to an API timeout. Proceeding with baseline data.",
                "sections": [
                    {"title": "Executive Summary", "content": f"Baseline report for {request.location}."},
                    {"title": "Recommendations", "content": "Please retry the analysis later."}
                ]
            }

        # 2. Generate PDF using ReportLab
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72
        )
        
        styles = getSampleStyleSheet()
        
        # Custom Styles
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=HexColor('#0ea5e9'),
            spaceAfter=30,
            alignment=1 # Center
        )
        
        heading_style = ParagraphStyle(
            'ReportHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=HexColor('#1e293b'),
            spaceBefore=20,
            spaceAfter=10
        )
        
        body_style = ParagraphStyle(
            'ReportBody',
            parent=styles['Normal'],
            fontSize=11,
            leading=16,
            spaceAfter=14
        )
        
        elements = []
        
        # Title Page
        elements.append(Spacer(1, 100))
        elements.append(Paragraph(f"GeoNarrative AI Intelligence Report", title_style))
        elements.append(Spacer(1, 20))
        elements.append(Paragraph(f"<b>Location:</b> {request.location}", ParagraphStyle('Center', parent=body_style, alignment=1, fontSize=14)))
        elements.append(Paragraph(f"<b>Report Type:</b> {request.report_type.replace('_', ' ').title()}", ParagraphStyle('Center', parent=body_style, alignment=1, fontSize=14)))
        elements.append(Paragraph(f"<b>Date:</b> {datetime.now().strftime('%Y-%m-%d %H:%M')}", ParagraphStyle('Center', parent=body_style, alignment=1, fontSize=14)))
        elements.append(Paragraph(f"<b>Risk Level:</b> {report_data.get('risk_level', 'Unknown').upper()}", ParagraphStyle('Center', parent=body_style, alignment=1, fontSize=14)))
        elements.append(PageBreak())
        
        # Sections
        for section in report_data.get('sections', []):
            elements.append(Paragraph(section.get('title', 'Section'), heading_style))
            
            content_text = section.get('content', '')
            # Split by newlines and add as separate paragraphs
            for p in content_text.split('\n'):
                if p.strip():
                    elements.append(Paragraph(p.strip(), body_style))
                    
        import asyncio
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, doc.build, elements)
        
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')

        # 3. Save to database ActivityLog and Report
        try:
            db_report = Report(
                location_name=request.location,
                report_type=request.report_type,
                summary=report_data.get('summary', '')[:500]
            )
            db.add(db_report)
            
            activity = ActivityLog(
                user_id=current_user.id,
                action_type="report_generation",
                details=f"Generated {request.report_type} report for {request.location}"
            )
            db.add(activity)
            
            await db.commit()
        except Exception as db_err:
            logger.error(f"Failed to log report generation to DB: {db_err}")
            await db.rollback()
        
        return {
            "id": report_id,
            "title": f"GeoAI {request.report_type.replace('_', ' ').title()} — {request.location}",
            "location": request.location,
            "generated_at": datetime.now().isoformat(),
            "risk_level": report_data.get("risk_level", "medium"),
            "summary": report_data.get("summary", ""),
            "sections": report_data.get("sections", []),
            "pdf_base64": pdf_base64
        }
