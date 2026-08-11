"""
Frontmatter: Title Page, Certificate, Declaration, Acknowledgement, Abstract,
Table of Contents, List of Figures/Tables, Abbreviations
"""
from doc_setup import *

THESIS_TITLE = "GeoNarrative AI: An Integrated GIS and 3D Digital Twin Framework for Urban Flood Susceptibility Assessment and Decision Support in Pune"

def add_title_page(doc):
    for _ in range(3):
        doc.add_paragraph()

    add_centered_text(doc, THESIS_TITLE, font_size=16, bold=True)

    for _ in range(2):
        doc.add_paragraph()

    add_centered_text(doc, "A Dissertation Submitted in Partial Fulfilment of the Requirements", font_size=12)
    add_centered_text(doc, "for the Degree of", font_size=12)
    add_centered_text(doc, "Master of Science (MSc)", font_size=14, bold=True)
    add_centered_text(doc, "in", font_size=12)
    add_centered_text(doc, "Data Science and Spatial Analytics", font_size=14, bold=True)

    for _ in range(2):
        doc.add_paragraph()

    add_centered_text(doc, "Submitted by", font_size=12)
    add_centered_text(doc, "Harnish Savant", font_size=14, bold=True)
    add_centered_text(doc, "PRN: [PRN TO BE INSERTED]", font_size=12)

    doc.add_paragraph()
    add_centered_text(doc, "Under the Guidance of", font_size=12)
    add_centered_text(doc, "Dr. T. P. Singh", font_size=14, bold=True)
    add_centered_text(doc, "Professor", font_size=12)

    for _ in range(2):
        doc.add_paragraph()

    add_centered_text(doc, "Department of Data Science and Spatial Analytics", font_size=13, bold=True)
    add_centered_text(doc, "Symbiosis Institute of Geoinformatics", font_size=13, bold=True)
    add_centered_text(doc, "Symbiosis International (Deemed University)", font_size=13, bold=True)
    add_centered_text(doc, "Pune, Maharashtra", font_size=12)
    add_centered_text(doc, "August 2026", font_size=12)

    add_page_break(doc)

def add_certificate(doc):
    add_heading(doc, "Certificate", level=1)
    add_paragraph(doc, f'This is to certify that the project report entitled "{THESIS_TITLE}" submitted by Harnish Savant (PRN: [PRN TO BE INSERTED]) is a bonafide record of the research work carried out under my supervision in partial fulfilment of the requirements for the award of the degree of Master of Science in Data Science and Spatial Analytics at Symbiosis Institute of Geoinformatics, Symbiosis International (Deemed University), Pune.')
    doc.add_paragraph()
    add_paragraph(doc, "The results embodied in this dissertation have not been submitted to any other university or institution for the award of any degree or diploma, to the best of my knowledge and belief.")

    for _ in range(4):
        doc.add_paragraph()

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    r = p.add_run("Date: _______________\n\nPlace: Pune")
    r.font.name = 'Times New Roman'

    doc.add_paragraph()
    p2 = doc.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r2 = p2.add_run("Dr. T. P. Singh\nProfessor\nDepartment of Data Science and Spatial Analytics\nSymbiosis Institute of Geoinformatics")
    r2.font.name = 'Times New Roman'

    add_page_break(doc)

def add_declaration(doc):
    add_heading(doc, "Declaration", level=1)
    add_paragraph(doc, f'I hereby declare that the dissertation entitled "{THESIS_TITLE}" is an authentic record of my own work carried out as a part of the MSc programme in Data Science and Spatial Analytics at Symbiosis Institute of Geoinformatics, Symbiosis International (Deemed University), Pune, under the guidance of Dr. T. P. Singh.')
    add_paragraph(doc, "I further declare that this work has not been submitted, either in part or in full, for any other degree, diploma, or award at this or any other university or institution. All sources of information and assistance used during this research have been duly acknowledged.")
    add_paragraph(doc, "I understand that any false claim in this regard shall result in disciplinary action as per the rules of the university.")

    for _ in range(4):
        doc.add_paragraph()

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    r = p.add_run("Date: _______________\n\nPlace: Pune")
    r.font.name = 'Times New Roman'

    doc.add_paragraph()
    p2 = doc.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r2 = p2.add_run("Harnish Savant\nPRN: [PRN TO BE INSERTED]")
    r2.font.name = 'Times New Roman'

    add_page_break(doc)

def add_acknowledgement(doc):
    add_heading(doc, "Acknowledgement", level=1)
    add_paragraph(doc, "I wish to express my sincere gratitude to my research guide, Dr. T. P. Singh, Professor, Department of Data Science and Spatial Analytics, Symbiosis Institute of Geoinformatics, for providing consistent direction, constructive feedback, and invaluable guidance throughout this research. His expertise in spatial analytics and disaster management shaped the methodological rigor and practical utility of this framework.")
    add_paragraph(doc, "I am grateful to the Director and Head of the Department at Symbiosis Institute of Geoinformatics for providing the analytical infrastructure, computational facilities, and supportive academic environment essential for conducting geospatial database modelling and AI integrations.")
    add_paragraph(doc, "I also thank the faculty members of the department who, through rigorous coursework in geographic information systems, spatial databases, remote sensing, and artificial intelligence, imparted the theoretical foundational knowledge that underpins this interdisciplinary thesis.")
    add_paragraph(doc, "I acknowledge the open-source communities and data providers behind OpenStreetMap, Copernicus Sentinel-2, QGIS, PostGIS, Python, and CesiumJS, whose openly accessible geographic datasets, spatial libraries, and visualization technologies made this decision-support implementation feasible.")
    add_paragraph(doc, "Finally, I express my deepest appreciation to my family and peers for their steady encouragement, patience, and moral support throughout the challenging duration of this Master's programme.")

    add_page_break(doc)

def add_abstract(doc):
    add_heading(doc, "Abstract", level=1)
    add_paragraph(doc, "Urban flooding poses a recurrent and severe disaster threat to rapidly developing metropolitan areas in monsoon-prone regions. In Pune, situated at the confluence of the Mula and Mutha rivers in western Maharashtra, heavy precipitation events and rapid surface sealing have repeatedly triggered severe inundation, affecting vulnerable populations and transport lifelines. While standard Geographic Information System (GIS) modelling identifies susceptible topography, conventional static risk maps lack three-dimensional spatial context, fail to communicate dynamic temporal flood progression, and require specialized GIS expertise to interpret, thereby limiting their utility for operational disaster management.")
    add_paragraph(doc, "To bridge this critical socio-technical and interdisciplinary decision-support gap, this study develops GeoNarrative AI, an integrated spatial decision-support framework for the Pune Municipal Corporation (PMC) administrative extent (506.91 km²). The methodology systematically unifies three pillars: (1) a multi-criteria GIS flood susceptibility assessment utilizing the Analytical Hierarchy Process (AHP) over conditioning factors derived from 30m Copernicus DEM and Sentinel-2 LULC datasets; (2) a terrain-constrained temporal flood scenario engine coupled with an interactive 3D Urban Digital Twin developed via CesiumJS, incorporating 180,307 municipal building footprints and 55,309 road network segments (7,445.90 km total length); and (3) an artificial intelligence layer featuring domain-grounded Natural Language Geospatial Interaction (GeoAI Assistant) and an automated Geospatial Technical Report Agent.")
    add_paragraph(doc, "Quantitative exposure results across simulated meteorological severity levels demonstrate a monotonic expansion in inundation impact: from 53.60 km² of temporary flood extent affecting 11,262 building footprints (8,808 within critical riparian zones) and 751.19 km of road segments under Normal flood conditions, scaling progressively up to 133.97 km² of inundation impacting 40,723 building footprints (32,084 critical) and 1,877.47 km of road segments under Extreme flood scenarios. The integration of live spatial analytical dashboards with project-aware conversational GeoAI enables decision-makers to interrogate geospatial models via natural language without software barriers.")
    add_paragraph(doc, "The outcomes affirm that uniting multi-criteria spatial analysis, temporal 3D digital twin visualization, and generative spatial intelligence creates an accessible, highly interpretive disaster decision-support instrument. This research advances disaster communication by transforming static spatial analytical outputs into dynamic, intelligible, and actionable risk intelligence.")

    doc.add_paragraph()
    p = doc.add_paragraph()
    r = p.add_run("Keywords: ")
    r.bold = True
    r.font.name = 'Times New Roman'
    r2 = p.add_run("Urban Flood Susceptibility, 3D Digital Twin, Analytical Hierarchy Process (AHP), GeoAI, Natural Language Geospatial Interaction, CesiumJS, PostGIS, Spatial Decision Support System, Pune Municipal Corporation.")
    r2.font.name = 'Times New Roman'

    add_page_break(doc)

def add_toc_placeholder(doc):
    add_heading(doc, "Table of Contents", level=1)
    p = doc.add_paragraph()
    r = p.add_run("[Generate Table of Contents in Microsoft Word: References tab \u2192 Table of Contents \u2192 Automatic Table 1]")
    r.italic = True
    r.font.color.rgb = RGBColor(128, 128, 128)
    r.font.size = Pt(11)
    add_page_break(doc)

def add_list_of_figures(doc):
    add_heading(doc, "List of Figures", level=1)
    p = doc.add_paragraph()
    r = p.add_run("[Generate List of Figures in Microsoft Word: References tab \u2192 Insert Table of Figures \u2192 Select 'Figure' label]")
    r.italic = True
    r.font.color.rgb = RGBColor(128, 128, 128)
    add_page_break(doc)

def add_list_of_tables(doc):
    add_heading(doc, "List of Tables", level=1)
    p = doc.add_paragraph()
    r = p.add_run("[Generate List of Tables in Microsoft Word: References tab \u2192 Insert Table of Figures \u2192 Select 'Table' label]")
    r.italic = True
    r.font.color.rgb = RGBColor(128, 128, 128)
    add_page_break(doc)

def add_abbreviations(doc):
    add_heading(doc, "List of Abbreviations", level=1)

    abbrs = [
        ("AHP", "Analytical Hierarchy Process"),
        ("API", "Application Programming Interface"),
        ("CRS", "Coordinate Reference System"),
        ("DEM", "Digital Elevation Model"),
        ("DSS", "Decision Support System"),
        ("DT", "Digital Twin"),
        ("EPSG", "European Petroleum Survey Group"),
        ("ESA", "European Space Agency"),
        ("FSI", "Flood Susceptibility Index"),
        ("FSM", "Flood Susceptibility Mapping"),
        ("GeoAI", "Geospatial Artificial Intelligence"),
        ("GIS", "Geographic Information System"),
        ("IMD", "India Meteorological Department"),
        ("KPI", "Key Performance Indicator"),
        ("LLM", "Large Language Model"),
        ("LULC", "Land Use / Land Cover"),
        ("MCDA", "Multi-Criteria Decision Analysis"),
        ("MCE", "Multi-Criteria Evaluation"),
        ("NLP", "Natural Language Processing"),
        ("OSM", "OpenStreetMap"),
        ("PMC", "Pune Municipal Corporation"),
        ("PMRDA", "Pune Metropolitan Region Development Authority"),
        ("REST", "Representational State Transfer"),
        ("SDSS", "Spatial Decision Support System"),
        ("SRTM", "Shuttle Radar Topography Mission"),
        ("UI / UX", "User Interface / User Experience"),
        ("UTM", "Universal Transverse Mercator"),
        ("WGS", "World Geodetic System"),
    ]

    add_table(doc, ["Abbreviation", "Full Form"], abbrs)
    add_page_break(doc)
