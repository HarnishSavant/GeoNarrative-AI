"""
Chapter 2: Literature Review
Focused on Flood Susceptibility Modelling + Digital Twin + Web GIS
"""
from doc_setup import *

def write_chapter_2(doc):
    add_heading(doc, "Chapter 2: Literature Review", level=1)

    add_heading(doc, "2.1 Introduction", level=2)
    add_paragraph(doc, "This chapter reviews the published literature across three domains that constitute the theoretical foundation of this study: flood susceptibility modelling using GIS-based multi-criteria methods, Digital Twin applications in urban systems and disaster management, and web-based GIS platforms for spatial decision support. The review identifies specific gaps that motivated the design choices adopted in this project.")

    # 2.2 Flood Susceptibility Modelling
    add_heading(doc, "2.2 Flood Susceptibility Modelling", level=2)
    add_paragraph(doc, "Flood susceptibility mapping identifies areas inherently prone to inundation based on geographic, hydrological, and land-use characteristics. The literature broadly distinguishes between data-driven machine learning methods and knowledge-driven multi-criteria approaches (Tehrany et al., 2019).")

    add_heading(doc, "2.2.1 Machine Learning Approaches", level=3)
    add_paragraph(doc, "Rahmati et al. (2016) applied Support Vector Machines and Random Forest classifiers to predict flood-prone areas in the Golestan Province, Iran, using 12 conditioning factors. Their study found that Random Forest outperformed SVM with an area under the curve (AUC) of 0.89. Zhao et al. (2019) compared Logistic Regression, SVM, and deep neural networks for flash flood susceptibility in a mountainous catchment, reporting that ensemble methods produced the most stable predictions. While these machine learning approaches achieve high predictive accuracy, they require labelled training data in the form of historical flood extent polygons. Such records are often unavailable or unreliable for Indian metropolitan areas, limiting the direct applicability of data-driven methods in data-scarce settings.")

    add_heading(doc, "2.2.2 Multi-Criteria Decision Analysis", level=3)
    add_paragraph(doc, "Multi-criteria decision analysis (MCDA) methods circumvent the labelled data requirement by relying on expert-assigned weights for spatial conditioning factors. The Analytical Hierarchy Process (AHP) developed by Saaty (1980) is the most widely adopted MCDA method in flood susceptibility research. Ouma and Tateishi (2014) applied AHP-weighted overlay analysis in a GIS environment to map flood vulnerability in Kenya, combining slope, elevation, drainage density, and soil permeability. Their approach achieved reasonable concordance with observed flood events and has since been replicated across monsoon-prone regions.")
    add_paragraph(doc, "Samanta et al. (2018) applied a similar AHP framework for flood susceptibility mapping in the Ajay River basin, West Bengal, using drainage density, rainfall, slope, soil type, and land use as conditioning factors. Their study is notable for documenting the consistency ratio of the AHP pairwise comparison matrix, a validation step frequently omitted in other studies. Souissi et al. (2020) combined AHP with fuzzy logic in Tunisia, demonstrating that hybrid MCDA techniques can accommodate uncertainty in weight assignment.")
    add_paragraph(doc, "A common limitation across these studies is that the weighted overlay computation is performed within desktop GIS software, producing a static raster output. The model runs once, the result is exported as an image, and any modification to weights or input data requires repeating the entire analysis manually. This static workflow limits the practical utility of the susceptibility map for ongoing urban planning decisions.")

    add_heading(doc, "2.2.3 Conditioning Factors in Urban Environments", level=3)
    add_paragraph(doc, "The selection of conditioning factors for flood susceptibility varies across studies but consistently includes elevation, slope, and proximity to watercourses as primary factors (Tehrany et al., 2019). In urban environments, additional factors become relevant: building density, which correlates with surface imperviousness, and land use and land cover, which determines infiltration capacity. This study incorporates five conditioning factors selected to capture both natural topographic influences and urban-specific impermeability characteristics.")

    # 2.3 Digital Twins
    add_heading(doc, "2.3 Digital Twin Technology", level=2)
    add_paragraph(doc, "The Digital Twin concept was formalised by Grieves (2014) as comprising a physical space, a virtual space, and the data connections between them. In urban applications, Digital Twins integrate heterogeneous spatial data within a three-dimensional virtual environment that mirrors the physical city.")

    add_heading(doc, "2.3.1 Urban Digital Twins", level=3)
    add_paragraph(doc, "Bolton et al. (2018) established the Gemini Principles for national Digital Twins, emphasising openness, security, and federation. Dembski et al. (2020) proposed an urban Digital Twin framework that integrates IoT sensors, BIM models, and GIS layers, distinguishing between static assets (terrain, buildings), semi-dynamic assets (infrastructure), and dynamic streams (traffic, weather). Their classification directly informs the asset categorisation adopted in this study, where terrain and buildings are treated as persistent layers while flood water and weather effects are rendered dynamically.")

    add_heading(doc, "2.3.2 Digital Twins in Flood Management", level=3)
    add_paragraph(doc, "White et al. (2021) reviewed Digital Twin applications in smart cities and identified three maturity levels. Level 1 systems provide static descriptive GIS. Level 2 systems offer diagnostic analytical dashboards. Level 3 systems integrate predictive capabilities and simulation. Most existing flood management platforms operate at Level 1 or Level 2, presenting pre-computed maps without analytical or simulation capabilities. This study targets a Level 2 to Level 3 system by coupling GIS-based flood susceptibility analysis with animated scenario simulation within a 3D environment.")
    add_paragraph(doc, "Ford and Wolf (2020) examined how Digital Twins can support disaster management through real-time data integration and scenario planning. Their work highlights that the value of a Digital Twin lies not only in visual realism but in enabling decision-makers to interact with spatial information rather than passively consuming static outputs.")

    # 2.4 Web GIS
    add_heading(doc, "2.4 Web-Based GIS for Decision Support", level=2)
    add_paragraph(doc, "The transition from desktop to web-based GIS has been accelerated by client-side mapping libraries and cloud-hosted terrain services. Yin et al. (2019) developed a web-based flood risk communication platform that demonstrated interactive visualisation improves stakeholder understanding compared to static PDF maps. However, their system served pre-computed layers without embedding analytical capabilities. Iqbal et al. (2021) built a web GIS for urban flood monitoring in Dhaka incorporating spatial queries and interactive map rendering, but without 3D terrain visualisation or scenario simulation.")
    add_paragraph(doc, "CesiumJS, the library adopted in this study, supports 3D terrain rendering with accurate elevation data, global building geometry from OpenStreetMap, and GPU-accelerated water material rendering. These capabilities make CesiumJS well-suited for Digital Twin applications that require three-dimensional spatial context for flood visualisation (Cesium, 2024).")

    # 2.5 Research Gap Analysis
    add_heading(doc, "2.5 Research Gap Analysis", level=2)
    add_paragraph(doc, "Table 2.1 presents a comparative analysis of the capabilities offered by existing approaches against those implemented in this study.")

    add_table(doc,
        ["Capability", "Desktop GIS", "Web Flood Platforms", "This Study"],
        [
            ["Flood susceptibility mapping", "Yes (static)", "Pre-computed only", "Yes (GIS-based)"],
            ["3D terrain visualisation", "Limited", "Some (2D dominant)", "Yes (CesiumJS)"],
            ["Interactive scenario simulation", "No", "Limited", "Yes (4 scenarios)"],
            ["Building-level 3D rendering", "No", "No", "Yes (OSM Buildings)"],
            ["Animated flood progression", "No", "No", "Yes (terrain-aware)"],
            ["Web accessible", "No (desktop)", "Yes", "Yes"],
            ["Decision support dashboard", "No", "Partial", "Yes (live telemetry)"],
            ["Conversational GeoAI copilot", "No", "No", "Yes (Gemini LLM tools)"],
            ["Automated technical report agent", "No", "No", "Yes (real-time studio)"],
            ["Open-source spatial stack", "No (proprietary)", "Varies", "Yes"],
        ],
        caption="Comparative Analysis of Flood Decision-Support & Visualization Frameworks",
        table_num="2.1"
    )

    add_paragraph(doc, "The comparison reveals that while desktop GIS provides robust analytical capabilities for flood susceptibility mapping, it lacks interactive visualization, temporal dynamism, and web accessibility. Existing web flood platforms provide some interactivity but do not embed analytical multi-criteria models or generative artificial intelligence within a 3D environment. This study bridges this socio-technical gap by integrating a GIS-based AHP flood susceptibility model with an interactive Level 3 Digital Twin, conversational GeoAI co-pilot capabilities, and real-time automated reporting within a single web-accessible platform.")

    # 2.6 Chapter Summary
    add_heading(doc, "2.6 Chapter Summary", level=2)
    add_paragraph(doc, "This chapter reviewed the relevant literature across flood susceptibility modelling, Digital Twin technology, and web-based GIS. The review established that AHP-based weighted overlay is a well-validated method for flood susceptibility assessment in data-scarce environments, that Digital Twin technology offers compelling advantages for interactive flood visualisation, and that the integration of these two approaches within a single platform remains an underexplored area. The next chapter describes the study area and its geographic, hydrological, and demographic characteristics.")

    add_page_break(doc)
