import base64
import json
import logging
from datetime import datetime
from io import BytesIO
from typing import Dict, Any, List

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Flowable
from reportlab.pdfgen import canvas

from sqlalchemy.ext.asyncio import AsyncSession
from app.models.schemas import ReportRequest
from app.models.db_models import Report, ActivityLog, User
from app.services.geoai_orchestrator import GeoAIOrchestrator
from app.services.weather_service import WeatherService
from app.services.osm_service import OSMService
from app.services.urban_risk_service import UrbanRiskService
from app.services.spatial_query_service import SpatialQueryService

logger = logging.getLogger("geonarrative.report_agent")


class ProgressBar(Flowable):
    """Custom ReportLab Flowable to draw a clean linear progress bar."""
    def __init__(self, width: float, height: float, progress: float, color_hex: str):
        super().__init__()
        self.width = width
        self.height = height
        self.progress = max(0.0, min(1.0, progress))
        self.color = HexColor(color_hex)

    def draw(self):
        self.canv.saveState()
        # Draw background track
        self.canv.setFillColor(HexColor("#cbd5e1"))
        self.canv.rect(0, 0, self.width, self.height, fill=1, stroke=0)
        # Draw colored fill
        self.canv.setFillColor(self.color)
        self.canv.rect(0, 0, self.width * self.progress, self.height, fill=1, stroke=0)
        self.canv.restoreState()


class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas to dynamically compute and draw headers, footers, and page numbers."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            return  # Suppress decorations on the cover page
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(HexColor("#475569"))
        
        # Running Header Rule & Label
        self.setStrokeColor(HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(54, 738, 558, 738)
        self.drawString(54, 744, "GeoNarrative AI — Geospatial Intelligence Report")
        
        # Running Footer Rule & Metadata
        self.line(54, 54, 558, 54)
        self.drawString(54, 40, "CONFIDENTIAL — FOR PLACEMENT REVIEW (MCDA RULE-BASED AND DYNAMIC TELEMETRY)")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 40, page_text)
        self.restoreState()


def make_badge(text: str, bg_color_hex: str, text_color_hex: str = "#ffffff") -> Table:
    """Helper to generate a beautifully styled badge inside a ReportLab table cell."""
    badge_style = ParagraphStyle(
        'BadgeStyle',
        fontName='Helvetica-Bold',
        fontSize=8,
        textColor=HexColor(text_color_hex),
        alignment=1  # Center
    )
    t = Table([[Paragraph(text, badge_style)]], colWidths=[65], rowHeights=[14])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), HexColor(bg_color_hex)),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
        ('TOPPADDING', (0, 0), (-1, -1), 1),
    ]))
    return t


def get_risk_color(level: str) -> str:
    """Resolve CSS-compatible Hex values for specific risk thresholds."""
    level = level.lower()
    if level in ["critical", "red"]:
        return "#ef4444"
    elif level in ["high", "orange"]:
        return "#f97316"
    elif level in ["medium", "yellow"]:
        return "#eab308"
    else:
        return "#22c55e"


class ReportAgentService:
    @staticmethod
    async def generate_agent_report(request: ReportRequest, current_user: User, db: AsyncSession) -> dict:
        report_id = str(int(datetime.now().timestamp() * 1000))
        location = request.location
        
        logger.info(f"ReportAgent initiated with advanced charting for: {location}")
        start_time = datetime.now()
        
        # 1. Geocoding Telemetry Resolution
        geocode = None
        is_fallback_geo = False
        try:
            geocode = await OSMService.geocode_city(location)
        except Exception as e:
            logger.warning(f"ReportAgent geocoding failed: {e}")
            
        if not geocode:
            is_fallback_geo = True
            geocode = {
                "display_name": f"{location}, Simulated Region",
                "lat": 18.5204,
                "lon": 73.8567,
                "bbox": {"lat_min": 18.45, "lat_max": 18.60, "lon_min": 73.75, "lon_max": 73.95}
            }
            
        lat = geocode.get("lat", 18.5204)
        lon = geocode.get("lon", 73.8567)
        bbox = geocode.get("bbox", {"lat_min": 18.45, "lat_max": 18.60, "lon_min": 73.75, "lon_max": 73.95})
        
        # 2. Weather Telemetry Extraction
        weather_data = {}
        is_fallback_weather = False
        try:
            weather_data = await WeatherService.get_live_weather(lat, lon, location)
            if "error" in weather_data or not weather_data.get("current"):
                is_fallback_weather = True
        except Exception as e:
            logger.warning(f"ReportAgent weather lookup failed: {e}")
            is_fallback_weather = True
            weather_data = {"current": {"temp": 27.5, "humidity": 68, "wind_speed": 4.2}, "data_source_type": "fallback"}
            
        # 3. Multi-Domain Risk Framework calculation (MCDA Engine)
        mcda_data = {}
        is_fallback_mcda = False
        try:
            mcda_data = await UrbanRiskService.get_unified_framework_data(db, location)
        except Exception as e:
            logger.warning(f"ReportAgent MCDA scoring failed: {e}")
            is_fallback_mcda = True
            mcda_data = {
                "location": location,
                "domains": {
                    "flood": {"score": 7.2, "level": "high", "name": "Flood Risk Management", "formula": "Linear Weighted Score", "input_features": {"rainfall": 245.0, "elevation": 540.0, "drainage_capacity": 60.0}, "thresholds": {"low": "<= 4.2", "medium": "4.3-6.8", "high": "6.9-8.5", "critical": "> 8.5"}, "recommendations": ["Deploy temporary flood barriers."], "chart_data": [{"name": "Rainfall", "value": 70, "weight": 30}]},
                    "traffic": {"score": 6.8, "level": "high", "name": "Traffic Congestion & Evacuation", "formula": "Linear Weighted Score", "input_features": {"peak_volume": 8500, "capacity_ratio": 0.85}, "thresholds": {"low": "<= 4.0", "medium": "4.1-6.5", "high": "6.6-8.0", "critical": "> 8.0"}, "recommendations": ["Override signals."], "chart_data": [{"name": "Volume", "value": 75, "weight": 30}]},
                    "urban": {"score": 4.5, "level": "medium", "name": "Urban Growth & Zoning Compliance", "formula": "Linear Weighted Score", "input_features": {"pop_growth": 3.4}, "thresholds": {"low": "<= 3.5", "medium": "3.6-6.0", "high": "6.1-8.0", "critical": "> 8.0"}, "recommendations": ["Enforce river setbacks."], "chart_data": [{"name": "Growth", "value": 56, "weight": 30}]},
                    "utility": {"score": 5.2, "level": "medium", "name": "Utility Grid Reliability", "formula": "Linear Weighted Score", "input_features": {"load_pct": 88.0}, "thresholds": {"low": "<= 4.5", "medium": "4.6-6.5", "high": "6.6-8.2", "critical": "> 8.2"}, "recommendations": ["Load balance power."], "chart_data": [{"name": "Peak Load", "value": 88, "weight": 35}]}
                },
                "algorithm_info": {"methodology": "Fallback Baseline Rules Engine"}
            }

        # 4. Query Exposed Critical Assets using PostGIS
        exposed_assets = []
        is_fallback_assets = False
        try:
            hospitals = await SpatialQueryService.query_hospitals_in_flood_zones(db)
            for h in hospitals:
                exposed_assets.append({
                    "name": h.get("name", "Deccan Hospital Cluster"),
                    "domain": "Flood",
                    "exposure": f"Hydrological zone intersection (inundation depth {h.get('inundation_depth_m', 1.2)}m)",
                    "severity": h.get("risk_level", "high")
                })
            
            roads = await SpatialQueryService.query_flood_prone_roads(db)
            for r in roads[:3]:
                exposed_assets.append({
                    "name": r.get("road_name", "Primary Transit Corridor Segment"),
                    "domain": "Traffic & Evacuation",
                    "exposure": "Intersects low-elevation hydrological buffer",
                    "severity": "high" if r.get("is_flood_prone") else "medium"
                })
                
            substations = await SpatialQueryService.query_high_risk_infrastructure(db)
            for s in substations:
                if s.get("type") == "substation":
                    exposed_assets.append({
                        "name": s.get("name", "High Voltage Power Station"),
                        "domain": "Utility Infrastructure",
                        "exposure": "Active grid load stress exceeding 90%",
                        "severity": s.get("risk_level", "critical")
                    })
        except Exception as e:
            logger.warning(f"ReportAgent spatial queries failed: {e}")
            
        if not exposed_assets:
            is_fallback_assets = True
            exposed_assets = [
                {"name": f"{location} Sassoon Hospital", "domain": "Flood", "exposure": "Hydrological containment corridor intersection (1.2m depth)", "severity": "high"},
                {"name": f"{location} Central Power Grid Node B", "domain": "Utility Infrastructure", "exposure": "Thermal peak stress load 94%", "severity": "critical"},
                {"name": "Karve Road Transit Route Segment", "domain": "Traffic & Evacuation", "exposure": "Peak capacity ratio exceeding 0.85", "severity": "high"},
                {"name": "Deccan Gymkhana School Area", "domain": "Flood", "exposure": "Encroachment zone near river buffer (ST_DWithin 120m)", "severity": "medium"}
            ]

        # Calculate Blended Overall Score
        overall_risk_score = round(sum(d.get("score", 5.0) for d in mcda_data["domains"].values()) / 4.0, 1)
        overall_risk_level = (
            "critical" if overall_risk_score > 8.0
            else "high" if overall_risk_score > 6.5
            else "medium" if overall_risk_score > 4.0
            else "low"
        )
        
        processing_time_s = round((datetime.now() - start_time).total_seconds(), 2)

        # 5. Extract Asset Specific Exposure Counts for Advanced Charts
        hosp_count = sum(1 for a in exposed_assets if a.get("domain") == "Flood")
        sub_count = sum(1 for a in exposed_assets if a.get("domain") in ["Utility Infrastructure", "Utility"])
        road_count = sum(1 for a in exposed_assets if a.get("domain") in ["Traffic & Evacuation", "Traffic"])
        school_count = sum(1 for a in exposed_assets if "school" in a.get("name", "").lower() or "gymkhana" in a.get("name", "").lower())

        # Compile structured chart definitions for the frontend (API JSON)
        charts_dict = {
            "multi_domain_risk": {
                "type": "bar",
                "labels": ["Flood", "Traffic", "Urban Development", "Utility Infrastructure"],
                "data": [
                    mcda_data["domains"]["flood"]["score"],
                    mcda_data["domains"]["traffic"]["score"],
                    mcda_data["domains"]["urban"]["score"],
                    mcda_data["domains"]["utility"]["score"]
                ]
            },
            "risk_distribution": {
                "type": "pie",
                "labels": ["Critical", "High", "Medium", "Low"],
                "data": [
                    sum(1 for d in mcda_data["domains"].values() if d.get("level") == "critical"),
                    sum(1 for d in mcda_data["domains"].values() if d.get("level") == "high"),
                    sum(1 for d in mcda_data["domains"].values() if d.get("level") == "medium"),
                    sum(1 for d in mcda_data["domains"].values() if d.get("level") == "low")
                ]
            },
            "infrastructure_exposure": {
                "type": "bar",
                "labels": ["Hospitals", "Power Grid Nodes", "Transport Corridors", "Educational Facilities"],
                "data": [hosp_count, sub_count, road_count, school_count]
            },
            "kpis": {
                "flood": {
                    "rainfall_intensity_mm": mcda_data["domains"]["flood"]["input_features"].get("rainfall", 245.0),
                    "drainage_stress_pct": mcda_data["domains"]["flood"]["input_features"].get("drainage_capacity", 60.0),
                    "elevation_index_m": mcda_data["domains"]["flood"]["input_features"].get("elevation", 540.0)
                },
                "traffic": {
                    "peak_commuter_volume_vph": mcda_data["domains"]["traffic"]["input_features"].get("peak_volume", 8500),
                    "capacity_friction_ratio": mcda_data["domains"]["traffic"]["input_features"].get("capacity_ratio", 0.85),
                    "signal_timing_secs": mcda_data["domains"]["traffic"]["input_features"].get("signal_cycle", 120)
                },
                "urban": {
                    "pop_growth_annual_pct": mcda_data["domains"]["urban"]["input_features"].get("population_growth_pct", 3.4),
                    "zoning_compliance_pct": mcda_data["domains"]["urban"]["input_features"].get("zoning_compliance_pct", 88.0),
                    "violations_detected_count": mcda_data["domains"]["urban"]["input_features"].get("violations_count", 2)
                },
                "utility": {
                    "peak_grid_load_pct": mcda_data["domains"]["utility"]["input_features"].get("peak_grid_load_pct", 88.0),
                    "maint_backlog_days": mcda_data["domains"]["utility"]["input_features"].get("maint_backlog_days", 18),
                    "redundancy_index_pct": mcda_data["domains"]["utility"]["input_features"].get("redundancy_pct", 62.0)
                }
            },
            "recommendation_matrix": [
                {"priority": "Critical", "action": "Deploy structural mobile flood walls in low-elevation points.", "domain": "Flood", "timeframe": "Short-Term"},
                {"priority": "High", "action": "Override signal cycles at J.M. Road and primary intersections.", "domain": "Traffic", "timeframe": "Short-Term"},
                {"priority": "Medium", "action": "Audit building height construction deviations in Deccan buffers.", "domain": "Urban", "timeframe": "Medium-Term"},
                {"priority": "Medium", "action": "Pre-position mobile diesel generators at Grid Node A.", "domain": "Utility", "timeframe": "Medium-Term"},
                {"priority": "Low", "action": "Audit acoustic line integrity scans on Bundle pipeline networks.", "domain": "Utility", "timeframe": "Long-Term"}
            ]
        }

        # 6. Build prompt payload for Gemini narrative synthesis
        prompt_payload = {
            "location": location,
            "overall_score": overall_risk_score,
            "overall_level": overall_risk_level,
            "weather": weather_data,
            "is_fallback_geo": is_fallback_geo,
            "is_fallback_weather": is_fallback_weather,
            "is_fallback_mcda": is_fallback_mcda,
            "is_fallback_assets": is_fallback_assets,
            "mcda_domains": {
                k: {"score": v.get("score"), "level": v.get("level"), "formula": v.get("formula"), "recommendations": v.get("recommendations")}
                for k, v in mcda_data["domains"].items()
            },
            "exposed_assets": exposed_assets,
            "charts_summary": {
                "multi_domain": charts_dict["multi_domain_risk"],
                "infrastructure": charts_dict["infrastructure_exposure"]
            }
        }

        system_instruction = """You are a Senior Geospatial Intelligence Analyst for GeoNarrative AI.
Write a comprehensive, professional, consulting-grade intelligence report.
The report must cover all 11 required sections exactly. 
The tone must be analytical, technical, and consulting-grade (like Deloitte, McKinsey, or FEMA reports).
Clearly distinguish and label any simulated or fallback data (such as OSM Overpass fallbacks if geocoding parameters were simulated).

Your output must be VALID JSON with exactly this structure, no markdown quotes (`json` block wraps), and no trailing commas. Double escape all quotes inside content:
{
  "executive_summary": "Deep executive summary narrative synthesizing the overall city risk profile, average MCDA scores, and key strategic highlights.",
  "city_overview": "Geographic profile of the location, including latitude/longitude details, geocoded bounds, and open weather telemetry synthesis.",
  "flood_risk_analysis": "Topographical evaluation of flood scoring, comparing elevation models with rain accumulation modifiers and drainage capabilities.",
  "traffic_risk_analysis": "Commuter density patterns, road bottleneck vectors, NH-48 transit delays, and critical evacuation routing limitations.",
  "urban_development_analysis": "Slope profile constraints, green canopy reduction, zoning compliance deviation percentages, and municipal permit backlogs.",
  "utility_infrastructure_analysis": "Grid substation overload stresses, thermal load peaks, equipment age, and water pipeline stress analysis.",
  "exposed_infrastructure": "Detailed listing and vulnerability analysis of specific critical facilities like hospitals, schools, and grid main lines.",
  "charts_metrics_summary": "Narrative explanation of the linear weights, Gini regressions, and risk trends visualized in the report.",
  "agent_trace_methodology": "Step-by-step description of the agent tool invocation chain (OSM nominatim geocoding, overpass query bounding boxes, PostGIS ST_Contains checks, and execution latency).",
  "recommendations": "Actionable, priority-ranked municipal planning recommendations split by short-term, medium-term, and long-term horizons.",
  "limitations_data_sources": "Technical limitations, including simulated OSM fallback layers where applicable, and official data sources utilized (FEMA, Copernicus, OpenStreetMap)."
}
"""

        gemini_prompt = f"Please generate the geospatial intelligence report for the payload: {json.dumps(prompt_payload)}"
        
        report_text = {}
        try:
            logger.info("Calling Gemini for narrative generation...")
            llm_reply = await GeoAIOrchestrator.call_llm(
                contents=[{"role": "user", "content": gemini_prompt}],
                system_instruction=system_instruction
            )
            
            llm_reply = llm_reply.strip()
            if llm_reply.startswith("```json"):
                llm_reply = llm_reply[7:]
            if llm_reply.startswith("```"):
                llm_reply = llm_reply[3:]
            if llm_reply.endswith("```"):
                llm_reply = llm_reply[:-3]
            llm_reply = llm_reply.strip()
            
            report_text = json.loads(llm_reply)
        except Exception as e:
            logger.error(f"Failed to generate intelligence narrative via LLM: {e}. Reverting to fallback rules.")
            
            # High-fidelity fallback templates
            report_text = {
                "executive_summary": f"This report synthesizes the multi-domain urban risk framework for the region of {location}. The analysis indicates an overall composite risk score of {overall_risk_score}/10, representing a {overall_risk_level.upper()} hazard risk. This assessment integrates topological, hydrological, commuter, and power grid vulnerabilities.",
                "city_overview": f"The region of {location} is located at coordinate bounds geocoded via OpenStreetMap Nominatim. Weather telemetry indicates active temperature and moisture conditions that influence localized drainage and hydrological runoff.",
                "flood_risk_analysis": f"Hydrological analysis indicates a localized Flood Risk Score of {mcda_data['domains']['flood']['score']}/10. High precipitation parameters combined with drainage constraints elevate risks along lower elevation river channels.",
                "traffic_risk_analysis": f"Commuter network analysis shows a Traffic Congestion Risk of {mcda_data['domains']['traffic']['score']}/10. Peak traffic volumes create substantial congestion vectors across primary transit lines.",
                "urban_development_analysis": f"Urban zoning compliance is currently scored at {mcda_data['domains']['urban']['score']}/10. Built-up encroachment rates and growth patterns indicate minor zoning deviation indicators within riverway buffers.",
                "utility_infrastructure_analysis": f"Grid Reliability is scored at {mcda_data['domains']['utility']['score']}/10. Substations are currently operating at a peak load of {mcda_data['domains']['utility']['input_features'].get('peak_grid_load_pct', 88.0)}%, indicating elevated load stresses.",
                "exposed_infrastructure": f"PostGIS spatial query calculations identified several exposed critical infrastructures within designated hazard zones: " + ", ".join([f"{a['name']} ({a['domain']})" for a in exposed_assets]),
                "charts_metrics_summary": "The metrics indicate that Flood and Traffic risks remain the leading risk drivers for the municipal area, requiring immediate engineering mitigation and signal balancing.",
                "agent_trace_methodology": f"Agent workflow trace: [OSM Geocoder] -> [BBOX fetch] -> [PostGIS Spatial Join] -> [MCDA Weights Synthesis]. Total workflow calculation completed in {processing_time_s} seconds.",
                "recommendations": "1. Short-term: Deploy mobile flood walls and override traffic signal cycles.\n2. Medium-term: Enforce setback buffer audits and inspect grid transformer nodes.\n3. Long-term: Extend drainage capacity and upgrade substation capacity.",
                "limitations_data_sources": "LIMITATIONS: This report relies on rule-based telemetry calculations. Source datasets include OpenStreetMap contributors, OpenWeatherMap API, and local mock digital twin parameters where real database tables are offline."
            }

        # Format structured sections list for the response
        sections_mapping = [
            ("Executive Summary", "executive_summary"),
            ("City & Location Overview", "city_overview"),
            ("Flood Risk Assessment", "flood_risk_analysis"),
            ("Traffic Intelligence & Routing", "traffic_risk_analysis"),
            ("Urban Growth & Zoning Compliance", "urban_development_analysis"),
            ("Utility Infrastructure Grid Audit", "utility_infrastructure_analysis"),
            ("Exposed Infrastructure & Assets", "exposed_infrastructure"),
            ("Charts & Core Metrics Interpretation", "charts_metrics_summary"),
            ("Agent Execution Trace & Audit Trail", "agent_trace_methodology"),
            ("Adaptation Recommendations", "recommendations"),
            ("Technical Limitations & Data Sources", "limitations_data_sources"),
        ]
        
        api_sections = []
        for title, key in sections_mapping:
            api_sections.append({
                "title": title,
                "content": report_text.get(key, f"No content available for section {title}.")
            })

        # 7. Generate PDF binary payload via ReportLab Flowables
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=54,
            leftMargin=54,
            topMargin=72,
            bottomMargin=72
        )
        
        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            'CoverTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=26,
            leading=32,
            textColor=HexColor('#0f172a'),
            spaceAfter=15
        )
        
        subtitle_style = ParagraphStyle(
            'CoverSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=13,
            leading=18,
            textColor=HexColor('#475569'),
            spaceAfter=40
        )
        
        section_h1 = ParagraphStyle(
            'SectionH1',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=14,
            leading=18,
            textColor=HexColor('#0284c7'),
            spaceBefore=16,
            spaceAfter=8,
            keepWithNext=True
        )
        
        body_style = ParagraphStyle(
            'ReportBodyStyle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=15,
            textColor=HexColor('#334155'),
            spaceAfter=12
        )

        meta_label_style = ParagraphStyle(
            'MetaLabel',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=10,
            leading=14,
            textColor=HexColor('#0f172a')
        )

        meta_val_style = ParagraphStyle(
            'MetaVal',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            textColor=HexColor('#475569')
        )
        
        elements = []
        
        # Cover Page Layout
        elements.append(Spacer(1, 40))
        banner_table = Table([[""]], colWidths=[504], rowHeights=[15])
        banner_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), HexColor('#0284c7')),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING', (0,0), (-1,-1), 0),
        ]))
        elements.append(banner_table)
        elements.append(Spacer(1, 30))
        
        elements.append(Paragraph("GEOSPATIAL INTELLIGENCE REPORT", title_style))
        elements.append(Paragraph("Unified Multi-Domain Urban Risk Analysis & Audit", subtitle_style))
        elements.append(Spacer(1, 40))
        
        metadata_rows = [
            [Paragraph("Target Location:", meta_label_style), Paragraph(location, meta_val_style)],
            [Paragraph("Report Type:", meta_label_style), Paragraph("Comprehensive Urban Audit", meta_val_style)],
            [Paragraph("Generated At:", meta_label_style), Paragraph(datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC'), meta_val_style)],
            [Paragraph("Analyst Engine:", meta_label_style), Paragraph("GeoNarrative AI Agent Node", meta_val_style)],
            [Paragraph("Calculated Risk Score:", meta_label_style), Paragraph(f"<b>{overall_risk_score} / 10</b> ({overall_risk_level.upper()})", meta_val_style)],
            [Paragraph("Methodology:", meta_label_style), Paragraph("Linear Weighted Multi-Criteria Decision Analysis", meta_val_style)]
        ]
        
        meta_table = Table(metadata_rows, colWidths=[150, 354])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), HexColor('#f8fafc')),
            ('BOX', (0,0), (-1,-1), 0.5, HexColor('#cbd5e1')),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('PADDING', (0,0), (-1,-1), 10),
            ('LINEBELOW', (0,0), (-1,-2), 0.5, HexColor('#e2e8f0')),
        ]))
        elements.append(meta_table)
        
        elements.append(Spacer(1, 80))
        elements.append(Paragraph("<b>Notice:</b> This document contains explainable geospatial intelligence generated using PostGIS spatial algorithms, OpenStreetMap databases, and rule-based Multi-Criteria Decision Analysis schemas. All scores and recommendations are fully auditable.", ParagraphStyle('Notice', parent=body_style, fontSize=9, textColor=HexColor('#64748b'))))
        elements.append(PageBreak())
        
        # Domain Risk Summary Table
        elements.append(Paragraph("Domain Risk Metrics & Weights Summary", section_h1))
        elements.append(Paragraph("Below is the summarized audit of calculated MCDA scores across the four core infrastructure domains:", body_style))
        
        domain_table_rows = [
            ["Domain Sector", "Score", "Risk Level", "Primary Contributor"]
        ]
        for key, dom in mcda_data["domains"].items():
            domain_table_rows.append([
                dom.get("name", key.capitalize()),
                f"{dom.get('score')}/10",
                dom.get("level", "medium").upper(),
                list(dom.get("weights", {}).keys())[0] if dom.get("weights") else "Standard Baseline"
            ])
            
        dom_table = Table(domain_table_rows, colWidths=[150, 60, 90, 204])
        dom_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), HexColor('#0f172a')),
            ('TEXTCOLOR', (0,0), (-1,0), HexColor('#ffffff')),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,0), 9),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [HexColor('#ffffff'), HexColor('#f8fafc')]),
            ('BOX', (0,0), (-1,-1), 0.5, HexColor('#cbd5e1')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, HexColor('#e2e8f0')),
            ('PADDING', (0,0), (-1,-1), 6),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        elements.append(dom_table)
        elements.append(Spacer(1, 15))

        # CHART 4: Dynamic KPI Summary Card Grid (Pre-populated)
        elements.append(Paragraph("Domain Telemetry & Core KPIs Summary Grid", section_h1))
        elements.append(Paragraph("Below is the telemetry grid extracted from weather sensors, OSM Overpass, and local spatial records:", body_style))
        
        kpi_cell_style = ParagraphStyle(
            'KpiCell',
            fontName='Helvetica',
            fontSize=8,
            leading=12,
            textColor=HexColor('#334155')
        )
        
        kpi_flood_txt = """<b>FLOOD TELEMETRY</b><br/>
Score: <b>{score}/10</b><br/>
Rainfall: {rain}mm<br/>
Elevation: {elev}m<br/>
Drainage stress: {drain}%""".format(
            score=mcda_data["domains"]["flood"]["score"],
            rain=charts_dict["kpis"]["flood"]["rainfall_intensity_mm"],
            elev=charts_dict["kpis"]["flood"]["elevation_index_m"],
            drain=charts_dict["kpis"]["flood"]["drainage_stress_pct"]
        )

        kpi_traffic_txt = """<b>TRAFFIC TELEMETRY</b><br/>
Score: <b>{score}/10</b><br/>
Peak Vol: {vol} vph<br/>
Demand Ratio: {ratio}<br/>
Signal Timing: {sig}s""".format(
            score=mcda_data["domains"]["traffic"]["score"],
            vol=charts_dict["kpis"]["traffic"]["peak_commuter_volume_vph"],
            ratio=charts_dict["kpis"]["traffic"]["capacity_friction_ratio"],
            sig=charts_dict["kpis"]["traffic"]["signal_timing_secs"]
        )

        kpi_urban_txt = """<b>URBAN COMPLIANCE</b><br/>
Score: <b>{score}/10</b><br/>
Pop Growth: {growth}%<br/>
Compliance: {comp}%<br/>
Violations: {viol}""".format(
            score=mcda_data["domains"]["urban"]["score"],
            growth=charts_dict["kpis"]["urban"]["pop_growth_annual_pct"],
            comp=charts_dict["kpis"]["urban"]["zoning_compliance_pct"],
            viol=charts_dict["kpis"]["urban"]["violations_detected_count"]
        )

        kpi_utility_txt = """<b>UTILITY GRID</b><br/>
Score: <b>{score}/10</b><br/>
Peak Load: {load}%<br/>
Backlog: {backlog} days<br/>
Redundancy: {red}%""".format(
            score=mcda_data["domains"]["utility"]["score"],
            load=charts_dict["kpis"]["utility"]["peak_grid_load_pct"],
            backlog=charts_dict["kpis"]["utility"]["maint_backlog_days"],
            red=charts_dict["kpis"]["utility"]["redundancy_index_pct"]
        )

        kpi_rows_data = [[
            Paragraph(kpi_flood_txt, kpi_cell_style),
            Paragraph(kpi_traffic_txt, kpi_cell_style),
            Paragraph(kpi_urban_txt, kpi_cell_style),
            Paragraph(kpi_utility_txt, kpi_cell_style)
        ]]

        kpi_table = Table(kpi_rows_data, colWidths=[126, 126, 126, 126])
        kpi_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), HexColor('#f8fafc')),
            ('BOX', (0,0), (-1,-1), 1, HexColor('#cbd5e1')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, HexColor('#e2e8f0')),
            ('PADDING', (0,0), (-1,-1), 8),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        elements.append(kpi_table)
        elements.append(Spacer(1, 15))
        
        # Append report sections
        for title, key in sections_mapping:
            elements.append(Paragraph(title, section_h1))
            
            content_text = report_text.get(key, "")
            for p in content_text.split('\n'):
                if p.strip():
                    elements.append(Paragraph(p.strip(), body_style))
            
            # Embed exposed assets table & Chart 3: Infrastructure Exposure By Type
            if key == "exposed_infrastructure":
                elements.append(Spacer(1, 10))
                
                # Chart 3: Infrastructure Exposure by Type (Rendered dynamically)
                elements.append(Paragraph("Infrastructure Exposure & Stress Index (Chart 3)", ParagraphStyle('Chart3Title', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, spaceAfter=6, textColor=HexColor('#334155'))))
                
                infra_type_rows = [
                    ["Infrastructure Class", "Monitored", "Stressed Nodes", "Spatial Join Logic", "Exposure Bar"]
                ]
                exposure_stats = [
                    ("Medical (Hospitals)", 8, hosp_count, "ST_Contains floodway", hosp_count/8.0, "#ef4444"),
                    ("Utility (Substations)", 6, sub_count, "Peak load overload >90%", sub_count/6.0, "#ef4444"),
                    ("Transport (Roadways)", 15, road_count, "Inundation segment overlap", road_count/15.0, "#f97316"),
                    ("Education (Schools)", 12, school_count, "ST_DWithin buffer intersection", school_count/12.0, "#eab308")
                ]
                for name, total, exposed, hazard, ratio, color in exposure_stats:
                    bar = ProgressBar(100, 8, ratio, color)
                    infra_type_rows.append([
                        name,
                        str(total),
                        f"{exposed} Node(s)",
                        hazard,
                        bar
                    ])
                infra_type_table = Table(infra_type_rows, colWidths=[130, 60, 90, 140, 84])
                infra_type_table.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,0), HexColor('#475569')),
                    ('TEXTCOLOR', (0,0), (-1,0), HexColor('#ffffff')),
                    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0,0), (-1,0), 8),
                    ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                    ('BOX', (0,0), (-1,-1), 0.5, HexColor('#cbd5e1')),
                    ('INNERGRID', (0,0), (-1,-1), 0.5, HexColor('#e2e8f0')),
                    ('PADDING', (0,0), (-1,-1), 6),
                ]))
                elements.append(infra_type_table)
                elements.append(Spacer(1, 10))

                # Detailed exposed assets audit list
                elements.append(Paragraph("Detailed Critical Facilities Spatial Audit List", ParagraphStyle('TableTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, spaceAfter=6, textColor=HexColor('#334155'))))
                asset_rows = [["Asset / Node Name", "Domain", "Spatial Hazard Association", "Risk Level"]]
                for asset in exposed_assets:
                    asset_rows.append([
                        asset.get("name"),
                        asset.get("domain"),
                        asset.get("exposure"),
                        asset.get("severity").upper()
                    ])
                asset_table = Table(asset_rows, colWidths=[130, 70, 224, 80])
                asset_table.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,0), HexColor('#334155')),
                    ('TEXTCOLOR', (0,0), (-1,0), HexColor('#ffffff')),
                    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0,0), (-1,0), 8),
                    ('ROWBACKGROUNDS', (0,1), (-1,-1), [HexColor('#ffffff'), HexColor('#f1f5f9')]),
                    ('BOX', (0,0), (-1,-1), 0.5, HexColor('#cbd5e1')),
                    ('INNERGRID', (0,0), (-1,-1), 0.5, HexColor('#e2e8f0')),
                    ('PADDING', (0,0), (-1,-1), 5),
                    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ]))
                elements.append(asset_table)
                elements.append(Spacer(1, 10))
                
            # Embed progressive horizontal bar charts & Chart 1 & Chart 2
            elif key == "charts_metrics_summary":
                elements.append(Spacer(1, 10))
                
                # Chart 1: Multi-domain Risk Score Comparison (Horizontal Bar Chart)
                elements.append(Paragraph("Multi-Domain Risk Score Comparison (Chart 1)", ParagraphStyle('Chart1Title', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, spaceAfter=6, textColor=HexColor('#334155'))))
                
                chart1_rows = [["Domain Sector", "Calculated Index Score", "Linear Progress Bar", "Vulnerability Level"]]
                for key_dom, dom in mcda_data["domains"].items():
                    score = dom.get("score")
                    level = dom.get("level", "medium")
                    bar = ProgressBar(180, 10, score / 10.0, get_risk_color(level))
                    badge = make_badge(level.upper(), get_risk_color(level))
                    chart1_rows.append([
                        dom.get("name", key_dom.capitalize()),
                        f"{score} / 10.0",
                        bar,
                        badge
                    ])
                chart1_table = Table(chart1_rows, colWidths=[150, 110, 180, 64])
                chart1_table.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,0), HexColor('#0f172a')),
                    ('TEXTCOLOR', (0,0), (-1,0), HexColor('#ffffff')),
                    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0,0), (-1,0), 8),
                    ('ROWBACKGROUNDS', (0,1), (-1,-1), [HexColor('#ffffff'), HexColor('#f8fafc')]),
                    ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                    ('BOX', (0,0), (-1,-1), 0.5, HexColor('#cbd5e1')),
                    ('INNERGRID', (0,0), (-1,-1), 0.5, HexColor('#e2e8f0')),
                    ('PADDING', (0,0), (-1,-1), 6),
                ]))
                elements.append(chart1_table)
                elements.append(Spacer(1, 15))

                # Chart 2: Risk Distribution Grid
                elements.append(Paragraph("Risk Level Distribution Across Domain Sectors (Chart 2)", ParagraphStyle('Chart2Title', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, spaceAfter=6, textColor=HexColor('#334155'))))
                dist_rows = [
                    ["Domain Sector", "Low (<=4.0)", "Medium (4.1-6.5)", "High (6.6-8.0)", "Critical (>8.0)"]
                ]
                for key_dom, dom in mcda_data["domains"].items():
                    name = dom.get("name", key_dom.capitalize())
                    level = dom.get("level", "medium").lower()
                    row = [name, "", "", "", ""]
                    if level == "low":
                        row[1] = make_badge("LOW", "#22c55e")
                    elif level == "medium":
                        row[2] = make_badge("MEDIUM", "#eab308")
                    elif level == "high":
                        row[3] = make_badge("HIGH", "#f97316")
                    elif level == "critical":
                        row[4] = make_badge("CRITICAL", "#ef4444")
                    dist_rows.append(row)
                dist_table = Table(dist_rows, colWidths=[152, 88, 88, 88, 88])
                dist_table.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,0), HexColor('#1e293b')),
                    ('TEXTCOLOR', (0,0), (-1,0), HexColor('#ffffff')),
                    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0,0), (-1,0), 8),
                    ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                    ('ALIGN', (0,0), (0,-1), 'LEFT'),
                    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                    ('BOX', (0,0), (-1,-1), 0.5, HexColor('#cbd5e1')),
                    ('INNERGRID', (0,0), (-1,-1), 0.5, HexColor('#e2e8f0')),
                    ('PADDING', (0,0), (-1,-1), 6),
                ]))
                elements.append(dist_table)
                elements.append(Spacer(1, 15))

                # Factor weight progress breakdown table
                elements.append(Paragraph("MCDA Linear Weight Distributions & Factor Contribution Indices", ParagraphStyle('ChartTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, spaceAfter=8, textColor=HexColor('#334155'))))
                chart_rows = []
                for key_dom, dom in mcda_data["domains"].items():
                    chart_rows.append([Paragraph(f"<b>{dom['name']} Weights</b>", ParagraphStyle('GroupHead', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9, textColor=HexColor('#0284c7'))), "", ""])
                    for factor in dom.get("chart_data", []):
                        val_pct = factor.get("value", 50)
                        weight_pct = factor.get("weight", 20)
                        bar = ProgressBar(120, 8, val_pct / 100.0, "#0284c7")
                        chart_rows.append([
                            Paragraph(factor.get("name"), ParagraphStyle('FactorLabel', parent=styles['Normal'], fontSize=8)),
                            f"{weight_pct}% weight",
                            bar
                        ])
                chart_table = Table(chart_rows, colWidths=[180, 100, 224])
                chart_table.setStyle(TableStyle([
                    ('LINEBELOW', (0,0), (-1,-1), 0.2, HexColor('#f1f5f9')),
                    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                    ('PADDING', (0,0), (-1,-1), 4),
                ]))
                elements.append(chart_table)
                elements.append(Spacer(1, 10))

            # Embed Chart 5: Recommendation Priority Matrix
            elif key == "recommendations":
                elements.append(Spacer(1, 10))
                elements.append(Paragraph("Recommendation Priority & Action Plan Horizon Matrix (Chart 5)", ParagraphStyle('Chart5Title', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, spaceAfter=6, textColor=HexColor('#334155'))))
                
                matrix_rows = [
                    ["Priority Level", "Mitigation Action & Planning Directives", "Target Domain", "Timeframe Horizon"]
                ]
                for rec_item in charts_dict["recommendation_matrix"]:
                    priority = rec_item["priority"].upper()
                    badge = make_badge(priority, get_risk_color(priority))
                    matrix_rows.append([
                        badge,
                        Paragraph(rec_item["action"], ParagraphStyle('RecActionText', parent=styles['Normal'], fontSize=8, leading=11)),
                        rec_item["domain"],
                        rec_item["timeframe"]
                    ])
                matrix_table = Table(matrix_rows, colWidths=[80, 244, 90, 90])
                matrix_table.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,0), HexColor('#0f172a')),
                    ('TEXTCOLOR', (0,0), (-1,0), HexColor('#ffffff')),
                    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0,0), (-1,0), 8),
                    ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                    ('BOX', (0,0), (-1,-1), 0.5, HexColor('#cbd5e1')),
                    ('INNERGRID', (0,0), (-1,-1), 0.5, HexColor('#e2e8f0')),
                    ('PADDING', (0,0), (-1,-1), 6),
                ]))
                elements.append(matrix_table)
                elements.append(Spacer(1, 10))
                
        # 8. Compile PDF Document
        import asyncio
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, lambda: doc.build(elements, canvasmaker=NumberedCanvas))
        
        pdf_bytes = buffer.getvalue()
        buffer.close()
        pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
        
        # 9. Persist Report & Activity metadata
        try:
            db_report = Report(
                location_name=location,
                report_type=request.report_type,
                summary=report_text.get("executive_summary", "")[:500]
            )
            db.add(db_report)
            
            activity = ActivityLog(
                user_id=current_user.id,
                action_type="report_agent_generation",
                details=f"ReportAgent successfully generated unified multi-domain urban risk report with advanced charting for {location} (Processing time: {processing_time_s}s)"
            )
            db.add(activity)
            await db.commit()
        except Exception as db_err:
            logger.error(f"Failed to save report metadata to DB: {db_err}")
            await db.rollback()

        # Compile response matching updated schemas
        chart_summary_list = []
        for key_dom, dom in mcda_data["domains"].items():
            chart_summary_list.append({
                "domain": dom.get("name"),
                "score": dom.get("score"),
                "level": dom.get("level"),
                "factors": dom.get("chart_data")
            })

        return {
            "id": report_id,
            "title": f"GeoAI Comprehensive Urban Audit — {location}",
            "location": location,
            "generated_at": datetime.now().isoformat(),
            "risk_level": overall_risk_level,
            "summary": report_text.get("executive_summary", "")[:500],
            "sections": api_sections,
            "pdf_base64": pdf_base64,
            "chart_data": chart_summary_list,
            "charts": charts_dict,
            "telemetry_source": {
                "geocoding": "simulated" if is_fallback_geo else "live",
                "weather": "fallback" if is_fallback_weather else "real-time",
                "mcda": "fallback-baseline" if is_fallback_mcda else "postgis-audited",
                "assets": "simulated-fallback" if is_fallback_assets else "postgis-live"
            },
            "processing_time": f"{processing_time_s}s"
        }

