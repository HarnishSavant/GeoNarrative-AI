import json
import base64
import logging
import re
from datetime import datetime
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.lib.units import inch

from sqlalchemy.ext.asyncio import AsyncSession
from app.models.schemas import ReportRequest
from app.models.db_models import User, ActivityLog, Report
from app.services.geoai_orchestrator import GeoAIOrchestrator
from app.services.geoai.query_planner import QueryPlanner
from app.services.spatial_query_service import SpatialQueryService

logger = logging.getLogger("geonarrative.report_service")

def draw_header_footer(canvas, doc, location, report_type):
    canvas.saveState()
    # Header
    canvas.setFont('Helvetica-Bold', 14)
    canvas.setFillColor(HexColor('#0ea5e9'))
    canvas.drawString(72, doc.pagesize[1] - 40, "GeoNarrative AI Platform")
    
    canvas.setFont('Helvetica-Bold', 9)
    canvas.setFillColor(HexColor('#ef4444'))
    canvas.drawRightString(doc.pagesize[0] - 72, doc.pagesize[1] - 40, "STRICTLY CONFIDENTIAL")
    
    # Header Line
    canvas.setStrokeColor(HexColor('#cbd5e1'))
    canvas.setLineWidth(1)
    canvas.line(72, doc.pagesize[1] - 50, doc.pagesize[0] - 72, doc.pagesize[1] - 50)
    
    # Footer Line
    canvas.line(72, 50, doc.pagesize[0] - 72, 50)
    canvas.setFont('Helvetica', 9)
    canvas.setFillColor(HexColor('#94a3b8'))
    canvas.drawString(72, 35, f"Automated Intelligence Briefing: {location} — {report_type.replace('_', ' ').title()}")
    canvas.drawRightString(doc.pagesize[0] - 72, 35, f"Page {doc.page}")
    canvas.restoreState()

class ReportService:
    @staticmethod
    async def generate_pdf_report(request: ReportRequest, current_user: User, db: AsyncSession) -> dict:
        report_id = str(int(datetime.now().timestamp() * 1000))
        
        # 1. Fetch Live Digital Twin Data based on Report Type
        logger.info(f"Gathering live spatial data for {request.report_type} report.")
        raw_data = {}
        
        try:
            if request.report_type == "flood_risk":
                raw_data["risk_summary"] = await QueryPlanner._execute_risk_query(db, {})
                raw_data["exposure_totals"] = await QueryPlanner._execute_exposure_query(db, {})
                
            elif request.report_type == "infrastructure_exposure":
                raw_data["critical_infrastructure"] = await QueryPlanner._execute_infrastructure_query(db, {})
                raw_data["exposure_totals"] = await QueryPlanner._execute_exposure_query(db, {})
                
            elif request.report_type == "emergency_planning":
                raw_data["shelters"] = await QueryPlanner._execute_shelter_query(db, {})
                raw_data["critical_facilities"] = await QueryPlanner._execute_infrastructure_query(db, {})
                
            elif request.report_type == "area_specific":
                raw_data["risk_summary"] = await QueryPlanner._execute_risk_query(db, {})
                raw_data["shelters"] = await QueryPlanner._execute_shelter_query(db, {})
            else:
                raw_data["city_wide_totals"] = await SpatialQueryService.get_total_feature_counts(db)
        except Exception as e:
            logger.error(f"Failed to fetch data for report: {e}")
            raw_data = {"error": "Failed to fetch spatial metrics."}

        # 2. Ask Gemini to generate report sections using the live data
        system_instruction = f"""You are a Senior Geospatial Intelligence Analyst for GeoNarrative AI.
Write a professional, consulting-grade intelligence report for {request.location}.
The report type is '{request.report_type}'.
The tone must be like a Deloitte consulting report, Urban Planning report, or Government intelligence report.

CRITICAL: You MUST use the following [LIVE SPATIAL DATA] to write your report. DO NOT hallucinate statistics.
[LIVE SPATIAL DATA]
{json.dumps(raw_data, indent=2)}

Your output must be VALID JSON with exactly this structure:
{{
  "risk_level": "low|medium|high|critical",
  "summary": "2-3 sentences executive summary based on the data",
  "sections": [
    {{
      "title": "Executive Summary",
      "content": "Detailed content..."
    }},
    {{
      "title": "Data Findings",
      "content": "Summarize the exact numbers provided in the context..."
    }},
    {{
      "title": "Risk & Vulnerability Analysis",
      "content": "Detailed content..."
    }},
    {{
      "title": "Recommendations & Interventions",
      "content": "Detailed actionable recommendations..."
    }}
  ]
}}
DO NOT INCLUDE ANY MARKDOWN CODE BLOCKS like ```json. ONLY return the raw JSON object. Ensure all quotes are properly escaped."""

        gemini_prompt = f"Please generate the '{request.report_type}' report for {request.location} based on the provided live metrics."
        
        try:
            logger.info(f"Generating AI Report for {request.location} with Gemini")
            llm_reply = await GeoAIOrchestrator.call_llm(
                contents=[{"role": "user", "content": gemini_prompt}],
                system_instruction=system_instruction,
                json_mode=True
            )
            
            # Clean possible markdown formatting using robust regex extraction
            json_match = re.search(r'\{.*\}', llm_reply, re.DOTALL)
            if json_match:
                llm_reply = json_match.group(0)
            
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

        # 3. Generate PDF using ReportLab
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
            fontSize=28,
            fontName='Helvetica-Bold',
            textColor=HexColor('#0f172a'),
            spaceAfter=20,
            alignment=1 # Center
        )
        
        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=HexColor('#0ea5e9'),
            spaceAfter=40,
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
        
        table_header_style = ParagraphStyle(
            'TableHeader',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=10,
            textColor=HexColor('#ffffff')
        )
        
        table_body_style = ParagraphStyle(
            'TableBody',
            parent=styles['Normal'],
            fontSize=10
        )
        
        elements = []
        
        # Title Page
        elements.append(Spacer(1, 120))
        elements.append(Paragraph(f"GEONARRATIVE AI", subtitle_style))
        elements.append(Paragraph(f"INTELLIGENCE REPORT", title_style))
        elements.append(Spacer(1, 30))
        
        meta_style = ParagraphStyle('CenterMeta', parent=body_style, alignment=1, fontSize=12, textColor=HexColor('#475569'))
        elements.append(Paragraph(f"<b>Target Region:</b> {request.location}", meta_style))
        elements.append(Paragraph(f"<b>Audit Type:</b> {request.report_type.replace('_', ' ').title()}", meta_style))
        elements.append(Paragraph(f"<b>Timestamp:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}", meta_style))
        
        risk_color = '#ef4444' if report_data.get('risk_level') in ['high', 'critical'] else '#f59e0b' if report_data.get('risk_level') == 'medium' else '#10b981'
        risk_style = ParagraphStyle('CenterRisk', parent=body_style, alignment=1, fontSize=14, textColor=HexColor(risk_color))
        elements.append(Spacer(1, 20))
        elements.append(Paragraph(f"<b>COMPOSITE RISK LEVEL: {report_data.get('risk_level', 'Unknown').upper()}</b>", risk_style))
        
        elements.append(PageBreak())
        
        # Sections
        for section in report_data.get('sections', []):
            elements.append(Paragraph(section.get('title', 'Section'), heading_style))
            
            content_text = section.get('content', '')
            # Split by newlines and add as separate paragraphs
            for p in content_text.split('\n'):
                if p.strip():
                    elements.append(Paragraph(p.strip(), body_style))
            
            # Embed Analytics Tables dynamically if section is Data Findings
            if "Data Findings" in section.get('title', ''):
                elements.append(Spacer(1, 10))
                
                if "risk_summary" in raw_data and "data" in raw_data["risk_summary"]:
                    elements.append(Paragraph("Flood Risk Summary Matrix", heading_style))
                    table_data = [[Paragraph("Risk Class", table_header_style), Paragraph("Hexagon Count", table_header_style)]]
                    for row in raw_data["risk_summary"]["data"]:
                        table_data.append([Paragraph(str(row.get('risk_class')), table_body_style), Paragraph(str(row.get('hex_count')), table_body_style)])
                    
                    t = Table(table_data, colWidths=[200, 200])
                    t.setStyle(TableStyle([
                        ('BACKGROUND', (0,0), (-1,0), HexColor('#1e293b')),
                        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                        ('INNERGRID', (0,0), (-1,-1), 0.5, HexColor('#cbd5e1')),
                        ('BOX', (0,0), (-1,-1), 1, HexColor('#1e293b')),
                        ('PADDING', (0,0), (-1,-1), 6)
                    ]))
                    elements.append(t)
                    elements.append(Spacer(1, 15))
                    
                if "exposure_totals" in raw_data and "data" in raw_data["exposure_totals"]:
                    elements.append(Paragraph("Asset Exposure Breakdown", heading_style))
                    table_data = [[Paragraph("Asset Type", table_header_style), Paragraph("Risk Class", table_header_style), Paragraph("Exposed Count", table_header_style)]]
                    for row in raw_data["exposure_totals"]["data"]:
                        table_data.append([Paragraph(str(row.get('asset_type')), table_body_style), Paragraph(str(row.get('risk_class')), table_body_style), Paragraph(str(row.get('exposed_count')), table_body_style)])
                    
                    t = Table(table_data, colWidths=[130, 130, 130])
                    t.setStyle(TableStyle([
                        ('BACKGROUND', (0,0), (-1,0), HexColor('#1e293b')),
                        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                        ('INNERGRID', (0,0), (-1,-1), 0.5, HexColor('#cbd5e1')),
                        ('BOX', (0,0), (-1,-1), 1, HexColor('#1e293b')),
                        ('PADDING', (0,0), (-1,-1), 6)
                    ]))
                    elements.append(t)
                    elements.append(Spacer(1, 15))
                    
        import asyncio
        loop = asyncio.get_running_loop()
        
        def build_pdf():
            doc.build(
                elements, 
                onFirstPage=lambda c, d: draw_header_footer(c, d, request.location, request.report_type), 
                onLaterPages=lambda c, d: draw_header_footer(c, d, request.location, request.report_type)
            )
            
        await loop.run_in_executor(None, build_pdf)
        
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')

        # 4. Save to database ActivityLog and Report
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
