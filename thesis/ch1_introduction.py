"""
Chapter 1: Introduction
Focused on Integrated GIS, Temporal Flood Scenarios, 3D Digital Twin, and GeoAI Decision Support
"""
from doc_setup import *

def write_chapter_1(doc):
    add_heading(doc, "Chapter 1: Introduction", level=1)

    # 1.1 Background
    add_heading(doc, "1.1 Background", level=2)
    add_paragraph(doc, "Urban flooding ranks among the most economically damaging and socially disruptive natural hazards in monsoon-prone regions of South Asia. Rapid surface sealing driven by urbanization, combined with increasingly intense precipitation events associated with climatic variability, systematically diminishes urban infiltration capacity and elevates surface runoff rates. In major metropolitan centers such as Pune in western Maharashtra, heavy monsoon downpours intersecting with dense urban form have repeatedly triggered severe inundation events, resulting in infrastructure disruption, financial loss, and socio-economic vulnerability.")
    add_paragraph(doc, "Geographic Information System (GIS) flood susceptibility mapping (FSM) serves as an established analytical technique for identifying spatial zones inherently prone to inundation based on topographic, hydrological, and anthropogenic conditioning factors. Among multi-criteria decision analysis (MCDA) techniques, the Analytical Hierarchy Process (AHP) weighted overlay method has been widely utilized because it enables rigorous spatial stratification of hazard zones without relying exclusively on comprehensive historical hydrographs or dense sensor networks. By incorporating factors such as elevation, terrain slope, proximity to drainage channels, and land cover impermeability, AHP-based FSM provides valuable diagnostic spatial intelligence.")
    add_paragraph(doc, "Despite analytical progress in spatial hazard modelling, conventional flood susceptibility assessments consistently produce static, two-dimensional outputs such as static maps or offline reports. These representations exhibit significant limitations in operational decision-making. Static maps lack temporal dynamism, fail to communicate how floodwater propagates across complex three-dimensional urban topography, and cannot interactively quantify critical infrastructure exposure under varying severe rainfall scenarios. Furthermore, technical proficiency barriers associated with specialized desktop GIS packages impede municipal authorities, disaster managers, and planners from directly interrogating analytical hazard layers during critical planning or disaster mitigation workflows.")
    add_paragraph(doc, "The emergence of interactive 3D Urban Digital Twins and Generative Geospatial Artificial Intelligence (GeoAI) presents a transformative opportunity to overcome these classical GIS limitations. A Digital Twin integrates structural geospatial data with simulation engines to provide an explorative virtual replica of urban infrastructure. By synthesizing multi-criteria flood susceptibility modeling, terrain-constrained temporal inundation scenarios, building-level exposure analytics, and domain-grounded conversational AI into a unified web platform, this research establishes an advanced Spatial Decision Support System (SDSS) tailored for the Pune Municipal Corporation.")

    # 1.2 Problem Statement
    add_heading(doc, "1.2 Problem Statement", level=2)
    add_paragraph(doc, "The overarching problem addressed by this research is the critical socio-technical disconnection between complex GIS-based flood hazard models and practical urban decision-making. Specifically, the research argument evolves through the following sequence of systemic limitations:")
    add_bullet_list(doc, [
        "Urban Flood Vulnerability: Monsoon-driven precipitation intersecting with dense impervious surfaces creates high flood vulnerability in urban centers like Pune.",
        "Complex Spatial Interaction: Inundation risk emerges from complex, non-linear interactions between topographic elevation, terrain slope, river hydrology, and urban built-up density.",
        "Identification via FSM: While GIS-based multi-criteria susceptibility modeling successfully identifies vulnerable terrain, conventional methodologies culminate solely in static diagnostic outputs.",
        "Static Interpretational Barriers: Two-dimensional static maps capture only a single static hazard layer, offering limited temporal interpretability and completely lacking three-dimensional visual intuition of urban morphology.",
        "Obfuscated Infrastructure Exposure: In traditional workflows, quantifying the precise vulnerability of urban lifelines—such as specific residential building footprints or transportation corridors—under progressive storm scenarios requires tedious, manual spatial intersection procedures.",
        "Fragmented Analytical Ecosystem: Quantitative statistics, GIS hazard layers, temporal scenario simulations, and explanatory reports typically reside in decoupled software software tools, hindering rapid synthesis during urban planning or disaster preparedness.",
        "Need for Integrated Decision Support: There exists an acute analytical requirement for an accessible, interoperable environment that seamlessly reconciles spatial hazard modeling with dynamic exploratory visualization.",
        "The GeoNarrative Framework: Consequently, this research develops the GeoNarrative AI framework, bridging advanced spatial analytical modeling with 3D digital twin simulations, natural-language geospatial query capabilities, and automated decision intelligence."
    ])

    # 1.3 Research Gap
    add_heading(doc, "1.3 Research Gap", level=2)
    add_paragraph(doc, "An evaluation of contemporary literature reveals that GIS flood susceptibility modeling, 3D urban digital twins, and artificial intelligence decision systems have historically evolved within siloed disciplinary paradigms. Numerous empirical studies implement AHP weighted overlays or statistical GIS modeling for flood mapping, yet their intellectual contribution typically halts at static cartographic validation within desktop software. Conversely, modern Digital Twin frameworks frequently excel at visual geometry rendering or energy monitoring, but rarely incorporate formal geospatial disaster multi-criteria models or dynamic vector exposure algorithms directly within the visualization canvas.")
    add_paragraph(doc, "Crucially, a definitive gap exists in computational integration and analytical interpretability. While recent studies explore web-based GIS dashboards (Level 2 Diagnostic Digital Twins), there remains a pronounced deficit in frameworks that unite Level 3 Simulation Digital Twins with Natural Language Geospatial Interaction (GeoAI). Specifically, no existing research framework within the context of Indian municipal disaster planning simultaneously integrates multi-criteria flood susceptibility grids, temporal terrain-constrained flood scenario propagation, real-time vector infrastructure exposure intersections, and domain-grounded conversational AI to democratize spatial insights. This dissertation directly targets this defensible integration, interpretability, and decision-support gap.")

    # 1.4 Research Questions
    add_heading(doc, "1.4 Research Questions", level=2)
    add_paragraph(doc, "To guide the conceptual and computational development of this research, three core research questions were established:")
    add_numbered_list(doc, [
        "RQ1: How can multi-criteria GIS spatial conditioning factors be formulated and synthesized to accurately demarcate flood susceptibility zones across the municipal terrain?",
        "RQ2: How can scenario-driven temporal flood propagation be modeled and coupled with spatial vector intersections to quantify progressive infrastructure exposure under varying storm intensities?",
        "RQ3: In what ways does an integrated 3D Urban Digital Twin and AI-assisted geospatial decision-support environment enhance the interpretation, communication, and operational utility of spatial flood intelligence?"
    ])

    # 1.5 Aim and Objectives
    add_heading(doc, "1.5 Research Aim and Objectives", level=2)
    add_paragraph(doc, "The primary research aim of this dissertation is to architect, implement, and evaluate an integrated GIS, 3D Digital Twin, and AI-assisted geospatial decision-support framework (GeoNarrative AI) for urban flood susceptibility assessment and infrastructure exposure modeling in Pune.")
    add_paragraph(doc, "To achieve this aim, three specific, measurable research objectives are defined:")
    add_numbered_list(doc, [
        "Objective 1: To construct and classify a multi-criteria GIS flood susceptibility model for the Pune Municipal Corporation area utilizing high-resolution topographic and remote sensing conditioning factors.",
        "Objective 2: To simulate terrain-constrained temporal flood propagation scenarios and computationally evaluate quantitative exposure across municipal building footprints and transportation networks.",
        "Objective 3: To integrate spatial analytics within a browser-based 3D Digital Twin featuring domain-grounded conversational GeoAI and automated reporting to support accessible, exploratory disaster risk decision-making."
    ])
    add_paragraph(doc, "A systematic methodological alignment connecting research questions, objectives, methodological techniques, results, and thesis conclusions is presented in Table 1.1.")

    # Table 1.1: Alignment Matrix
    headers_t1 = ["Research Question", "Specific Objective", "Methodological Technique", "Analytical Result", "Conclusion Trace"]
    rows_t1 = [
        ["RQ1: Spatial susceptibility conditioning formulation", "Obj 1: Construct & classify multi-criteria FSM", "AHP weighted overlay (Copernicus DEM, Sentinel-2 LULC, distance, slope)", "5-class FSI mapping & municipal susceptibility zones (Ch 6.2)", "Validated spatial hazard stratification (Ch 8.2)"],
        ["RQ2: Scenario temporal propagation & infrastructure exposure", "Obj 2: Simulate temporal flood expansion & infrastructure impact", "Terrain-constrained flood expansion algorithm & vector spatial intersection", "Monotonic progression statistics, building/road exposure tables (Ch 6.3)", "Quantified scenario vulnerability benchmarks (Ch 8.2)"],
        ["RQ3: Integrated 3D Digital Twin & AI decision support", "Obj 3: Develop web 3D twin with GeoAI interaction & reporting", "CesiumJS tiling, PostGIS/FastAPI pipeline, LLM context tool routing", "Interactive command dashboard, GeoAI assistant, technical report agent (Ch 6.4)", "Democratized spatial decision intelligence (Ch 8.2)"]
    ]
    add_table(doc, headers_t1, rows_t1, caption="Research Question, Objective, and Methodology Alignment Matrix", table_num="1.1")

    # 1.6 Scope and Limitations
    add_heading(doc, "1.6 Scope and Limitations", level=2)
    add_paragraph(doc, "The operational boundaries and methodological parameters governing this research are defined as follows:")
    add_bullet_list(doc, [
        "Geographic Extent: The study strictly encapsulates the administrative territory of the Pune Municipal Corporation (PMC) in Maharashtra, India, spanning an analytical area of approximately 506.91 km² bounded within longitudes 73.7319°E to 74.0184°E and latitudes 18.3854°N to 18.6218°N.",
        "Spatial Datasets: Primary raster datasets include the Copernicus GLO-30 Digital Elevation Model (~30m horizontal resolution) and European Space Agency (ESA) Sentinel-2 derived Land Use / Land Cover (LULC, 10m resolution). Vector geodatabase layers incorporate 180,307 municipal building footprints and 55,309 road network segments derived from verified GIS survey databases.",
        "Analytical Hazard Scope: Susceptibility analysis relies upon AHP Multi-Criteria Evaluation. Due to computational efficiency requirements and the absence of micro-scale underground stormwater network schematics, 2D hydrodynamic finite-element simulation (e.g., fully calibrated HEC-RAS 2D) is explicitly excluded.",
        "Scenario & Exposure Limitations: Inundation progression utilizes terrain-constrained spatial expansion rather than fluid dynamic Navier-Stokes modeling. Reported water depth statistics reflect scenario-derived relative inundation depth estimates over DEM cells rather than field-calibrated physical gauge depths.",
        "Validation Framework: Due to historical flood extent data scarcity, methodological validation relies upon spatial coherence checks against documented 2019/2024 riparian inundation corridors, scenario monotonicity verification, and programmatic infrastructure intersection validation."
    ])

    # 1.7 Research Contribution
    add_heading(doc, "1.7 Contribution of the Study", level=2)
    add_paragraph(doc, "This thesis makes a rigorous academic contribution at the intersection of Spatial Data Science, Geoinformatics, and Disaster Decision Support. Specifically, the contributions comprise:")
    add_bullet_list(doc, [
        "Methodological Integration: A reproducible geospatial pipeline that seamlessly transitions from static GIS AHP weighted susceptibility analysis into interactive, temporal 3D scenario simulations.",
        "Quantitative Municipal Infrastructure Assessment: Verified numerical exposure evaluations quantifying building footprint containment (11,262 to 40,723 affected units) and road segment inundation (751.19 km to 1,877.47 km) across four distinct rainfall meteorological scenarios.",
        "Natural Language Geospatial Intelligence: The implementation of a project-aware conversational GeoAI Assistant and automated Report Agent capable of real-time geospatial tool execution, lowering software proficiency barriers for non-specialist decision-makers."
    ])

    # 1.8 Thesis Organisation
    add_heading(doc, "1.8 Organisation of the Dissertation", level=2)
    add_paragraph(doc, "This dissertation is systematically structured across seven chapters. Chapter 2 synthesizes theoretical literature regarding urban flood susceptibility, multi-criteria spatial modeling, Digital Twins, and GeoAI systems. Chapter 3 introduces the geographic, climatic, and hydrological profile of the Pune Municipal Corporation study area along with data catalog characteristics. Chapter 4 delineates the scientific research methodology, detailing pre-processing, AHP mathematical formulation, scenario propagation algorithms, and spatial vector intersections. Chapter 5 covers system software engineering, data pipeline architecture, and 3D web rendering integration. Chapter 6 presents verified quantitative analytical results across GIS hazard layers, scenario exposure models, and interactive module performances along with scholarly discussion. Finally, Chapter 7 summarizes key research conclusions, traces objective achievements, addresses methodological limitations, and outlines recommendations for future research.")

    add_page_break(doc)
