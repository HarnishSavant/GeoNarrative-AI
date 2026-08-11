"""
Chapter 4: Research Methodology
Rigorous academic methodology focused on Multi-Criteria AHP Modeling, Terrain-Constrained Temporal Scenarios, Vector Infrastructure Intersection, 3D Digital Twin, and GeoAI Integration
"""
from doc_setup import *

def write_chapter_4(doc):
    add_heading(doc, "Chapter 4: Research Methodology", level=1)

    add_heading(doc, "4.1 Introduction", level=2)
    add_paragraph(doc, "This chapter articulates the rigorous scientific methodology structured to design, evaluate, and deploy the GeoNarrative AI geospatial decision-support framework. Transitioning beyond conventional static GIS cartography, this research adopts a holistic analytical workflow connecting multi-criteria decision analysis (MCDA), spatial vector intersection algorithms, terrain-constrained scenario propagation, three-dimensional digital twin rendering, and natural language generative intelligence. Every procedural step—from coordinate harmonization to AI tool routing—is formally specified to ensure complete scientific reproducibility.")

    # 4.2 Research Workflow
    add_heading(doc, "4.2 Methodological Workflow Framework", level=2)
    add_paragraph(doc, "The overarching methodology executes across seven interdependent analytical phases as illustrated in the publication-quality methodological framework diagram (Figure 4.1). The pipeline systematically progresses from problem conceptualization and data acquisition through spatial conditioning and susceptibility indexing, culminating in temporal simulation, interactive 3D digital twin orchestration, and artificial intelligence decision support.")

    add_mermaid_placeholder(doc, "Research Methodology Framework", """graph TD
    A["RESEARCH PROBLEM"] --> B["LITERATURE REVIEW & GAP ANALYSIS"]
    B --> C["STUDY AREA DEFINITION (PMC 506.91 km²)"]
    C --> D["DATA ACQUISITION (DEM, LULC, OSM Vectors)"]
    D --> E["DATA PREPROCESSING (CRS Harmonization, Masking, Geometry Cleaning)"]
    E --> F["SPATIAL CONDITIONING FACTORS (Elevation, Slope, River Dist, LULC, Density)"]
    F --> G["AHP / MULTI-CRITERIA DECISION ANALYSIS"]
    G --> H["FLOOD SUSCEPTIBILITY INDEX (FSI) COMPUTATION"]
    H --> I["SUSCEPTIBILITY ZONAL CLASSIFICATION (5 Classes)"]
    E --> J["SCENARIO CONSTRUCTION (Normal, Moderate, Heavy, Extreme)"]
    J --> K["TERRAIN-CONSTRAINED TEMPORAL FLOOD PROPAGATION"]
    K --> L["INFRASTRUCTURE EXPOSURE (Vector Spatial Intersections)"]
    I --> M["3D DIGITAL TWIN ENGINE (CesiumJS 3D Visualization)"]
    L --> M
    M --> N["ANALYTICS / PREDICTION / GEOAI ASSISTANT / REPORT AGENT"]
    N --> O["METHODOLOGICAL VALIDATION & SPATIAL INTERPRETATION"]
    O --> P["DECISION-SUPPORT RISK COMMUNICATION"]""")

    add_figure_placeholder(doc, "4.1", "Methodological Workflow Framework of GeoNarrative AI", "Conceptual research pipeline connecting multi-criteria susceptibility indexing with temporal simulation, 3D visualization, and generative spatial intelligence.")

    # 4.3 Data Preprocessing and Harmonization
    add_heading(doc, "4.3 Data Preprocessing and Spatial Harmonization", level=2)
    add_paragraph(doc, "Raw multi-source spatial datasets inherently exhibit divergent coordinate reference systems (CRS), topological inconsistencies, and raster resolution variances. To establish analytical rigor and programmatic stability across the PostGIS geodatabase and Python analytical pipelines, strict preprocessing protocols were enforced:")
    add_numbered_list(doc, [
        "CRS Harmonization & Reprojection: All vector and raster layers were transformed into the global horizontal datum World Geodetic System 1984 (WGS 84, EPSG:4326) to maintain web GIS interoperability. For spatial geomorphological operations requiring precise metric distance calculations—including geodetic buffering, river corridor distance evaluation, and linear road network intersections—geometries were dynamically transformed into Universal Transverse Mercator (UTM) Zone 43N (EPSG:32643), which guarantees conformal linear and planar accuracy across western Maharashtra.",
        "Administrative Clipping and Masking: The official Pune Municipal Corporation vector polygon (PMC.geojson, ~506.91 km²) served as an analytical mask. Raster layers (Copernicus DEM and Sentinel-2 LULC) were strictly cropped to the PMC polygon boundary, removing extraneous peripheral anomalies and handling NoData cells via zero-fill or interpolation where appropriate.",
        "Vector Topological Validation: Vector datasets sourced from municipal GIS geodatabases (MyProject8.gdb) underwent programmatic validation using Shapely and GeoPandas libraries. Invalid MultiPolygon self-intersections and sliver polygons were corrected using automated geometric repair routines (make_valid()), producing cleaner vector matrices containing exactly 180,307 building structural footprints and 55,309 linear roadway segments.",
        "DEM & Terrain Preparation: The Copernicus GLO-30 Digital Elevation Model (30m spatial resolution) was preprocessed to remove boundary digital elevation anomalies. Algorithmic derivations were executed to extract continuous slope degrees and topographic aspect arrays across the entire municipal expanse."
    ])

    # 4.4 AHP Flood Susceptibility Modeling
    add_heading(doc, "4.4 Multi-Criteria AHP Flood Susceptibility Modeling", level=2)
    add_paragraph(doc, "To diagnose spatial flood risk independently of calibrated hydraulic gauge instrumentation, a multi-criteria evaluation (MCE) relying upon Saaty's Analytical Hierarchy Process (AHP) was formulated. Five core spatial conditioning factors were conceptualized, justified, and reclassified into standardized dimensionless integer risk scores ranging from 1 (minimal contribution to hazard) to 5 (maximum contribution to hazard):")
    add_bullet_list(doc, [
        "Elevation (m MSL): Extracted from Copernicus DEM. Low-lying alluvial topography natively impedes drainage and acts as accumulation basins during severe rainfall. (Assigned weight: 0.35)",
        "Distance to Waterways (m): Evaluated via Euclidean distance calculations from the 171 permanent Mula-Mutha water features in UTM Zone 43N metric space. Proximal zones undergo direct lateral inundation during channel overtopping. (Assigned weight: 0.25)",
        "Terrain Slope (°): Computed from DEM derivatives. Flat planar terrain (<2.5°) promotes pluvial stagnation and ponding, whereas steep gradients accelerate gravitational runoff. (Assigned weight: 0.20)",
        "Land Use / Land Cover (LULC): Sourced from Sentinel-2 classifications. Impervious built-up concrete surfaces maximize surface runoff coefficients (~0.90), whereas forested green belts promote natural soil infiltration. (Assigned weight: 0.10)",
        "Building Footprint Density (Count/Unit Area): Evaluated from municipal vector footprints. Dense urban concentrations amplify surface runoff channeling and reflect severe asset exposure. (Assigned weight: 0.10)"
    ])
    add_paragraph(doc, "Note on Methodological Refinement: While preliminary developmental versions of the research explored a 6-factor formulation incorporating 'Distance to Roads' (weight 0.05), sensitivity analysis revealed strong spatial multi-collinearity between roadway density and building footprint density in dense municipal wards. Consequently, the finalized empirical model adopted the parsimonious 5-factor structure summarized above (summing precisely to 1.00), aligning with established hydrological literature for urban monsoon basins.")
    add_paragraph(doc, "The continuous Flood Susceptibility Index (FSI) across cell i was mathematically computed via linear weighted overlay:")

    add_equation(doc, "FSI_i = \\sum_{j=1}^{5} (w_j \\cdot S_{i,j}) = (0.35 \\cdot S_{elev}) + (0.25 \\cdot S_{dist}) + (0.20 \\cdot S_{slope}) + (0.10 \\cdot S_{lulc}) + (0.10 \\cdot S_{dens})", eq_num="4.1")

    add_paragraph(doc, "where FSI_i represents the computed susceptibility score at cell i, w_j denotes the normalized criterion weight of factor j (where \\sum w_j = 1.0), and S_{i,j} is the standard reclassified score (1 to 5) of factor j at cell i. Regarding hierarchical validation, because factor weights were directly adapted and calibrated from verified hydro-geographical research literature for Indian municipal environments rather than derived through de novo expert comparative matrices, a formal Consistency Ratio (CR) eigenvalue matrix was not calculated from scratch; this transparently preserves analytical integrity.")
    add_paragraph(doc, "The resultant continuous FSI distribution (ranging from 1.0 to 5.0) was segmented into five categorical susceptibility zones via equal interval numerical classification as structured in Table 4.1.")

    add_table(doc,
        ["Susceptibility Class", "FSI Numerical Interval", "Geomorphological and Urban Interpretation"],
        [
            ["Very Low", "1.00 – 1.80", "Elevated western ridge topography and steep hillslopes displaying high runoff momentum."],
            ["Low", "1.80 – 2.60", "Moderate sloping terrain and peripheral vegetated zones with low stagnation risk."],
            ["Moderate", "2.60 – 3.40", "Intermediate suburban zones; susceptible to transient pluvial pooling during cloudbursts."],
            ["High", "3.40 – 4.20", "Planar urban terrain adjacent to secondary drainage channels; recurrent inundation risk."],
            ["Very High", "4.20 – 5.00", "Immediate Mula-Mutha riverine floodplain and low-elevation impervious urban centers."]
        ],
        caption="Categorical Flood Susceptibility Classification Scheme",
        table_num="4.1"
    )

    # 4.5 Scenario-Based Temporal Flood Propagation Engine
    add_heading(doc, "4.5 Scenario-Based Temporal Flood Propagation Engine", level=2)
    add_paragraph(doc, "A critical methodological enhancement of this dissertation over previous static studies is the replacement of primitive global water planes (e.g., historical rudimentary 15 km EllipseGeometry extrusion geometries) with an engineered terrain-constrained temporal flood propagation engine. It is essential to delineate the fundamental scientific distinction between Flood Susceptibility (the static diagnostic propensity of terrain to flood based on morphology) and Scenario-Based Temporal Inundation (the dynamic simulation of floodwater spatial expansion over simulation time).")
    add_paragraph(doc, "The temporal propagation pipeline models inundation under four established meteorological severity scenarios: Normal, Moderate, Heavy, and Extreme. Unlike primitive raising of horizontal geometric water planes—which unrealistically floods elevated inland basins completely severed from river sources—the implemented engine applies terrain-constrained growth algorithms:")
    add_numbered_list(doc, [
        "Permanent Water Baseline Initialization: Simulation commences exclusively from the verified 171 permanent water features (~9.06 km²) of the Mula-Mutha hydrology layer, establishing the physical starting geometry.",
        "Terrain & Cost Constraint Rules: Iterative expansion algorithms candidate adjacent cells by comparing local Copernicus elevation thresholds and hydrological distance costs against simulated flood severity elevations. Inundation advances outward along riparian valleys, filling low-lying topographical accumulation depressions before climbing elevated terraces.",
        "Raster Mask Generation & Manifest Encoding: For each scenario duration, precomputed spatial flood rasters are generated across discrete simulation frames: Normal (30 frames), Moderate (35 frames), Heavy (40 frames), and Extreme (45 frames). Each scenario manifest records precise bounding geodetics (bounds_wgs84) and cumulative frame statistical metrics.",
        "Monotonicity Constraint Formulation: To uphold hydrological fidelity during visual progression, a strict monotonic expansion rule is programmatically enforced across successive temporal intervals:"
    ])

    add_equation(doc, "A(t_1) \\le A(t_2) \\le \\dots \\le A(t_n)", eq_num="4.2")

    add_paragraph(doc, "where A(t_k) denotes the total cumulative inundated surface area (in km²) at simulation frame interval t_k. Monotonic progression ensures that during an ongoing rainfall event simulation, inundated perimeter boundaries smoothly expand outward without unphysical oscillations or disappearing geometries. During live frontend playback, the simulation master clock interpolates intermediate rendering frames using crossfade alpha blending between sequential raster PNG textures, ensuring seamless visual dynamics over Cesium 3D terrain.")
    add_paragraph(doc, "Scientific Transparency Note: The scenario simulation architecture functions as an advanced GIS decision-support scenario visualization engine rather than a fluid-dynamics calibrated shallow water hydrograph model (such as HEC-RAS 2D or Mike FLOOD). It is engineered to deliver instantaneous interactive scenario comprehension without computational bottlenecks.")

    # 4.6 Infrastructure Exposure Methodology
    add_heading(doc, "4.6 Vector Infrastructure Exposure Assessment", level=2)
    add_paragraph(doc, "To quantify disaster exposure across municipal urban lifelines, the methodology avoids estimations or proportional proxy algorithms by executing precise vector-raster and vector-vector spatial intersection algorithms within UTM Zone 43N projected coordinate space:")
    add_paragraph(doc, "1. Building Footprint Exposure: The exact boundaries of the simulated flood extent polygon at frame t are mathematically evaluated against all 180,307 municipal building footprint geometries. A structural footprint is designated as an 'Affected Building' if its polygon centroid falls within an active inundation zone:")

    add_equation(doc, "B_{affected} = \\{ b \\in \\mathcal{B}_{PMC} \\mid \\text{ST_Intersects}(\\text{Centroid}(b), \\Omega_{flood}) = \\text{true} \\}", eq_num="4.3")

    add_paragraph(doc, "where \\mathcal{B}_{PMC} represents the total building database (180,307 structures) and \\Omega_{flood} represents the spatial inundation extent. Furthermore, to identify ultra-high-risk structures requiring emergency evacuation prioritization, a metric buffer of 30 meters is constructed around permanent water channels; affected buildings contained within this riparian buffer are formally classified as 'Critical Buildings' and rendered dynamically in hazard colors (Yellow for Affected; Red for Critical) within the 3D digital twin.")
    add_paragraph(doc, "2. Transportation Network Exposure: To calculate transport corridor disruption, line-polygon spatial intersections are executed across all 55,309 road polylines against the inundation polygon:")

    add_equation(doc, "L_{affected} = \\sum_{r \\in \\mathcal{R}_{PMC}} \\text{Length}(\\text{ST_Intersection}(r, \\Omega_{flood}))", eq_num="4.4")

    add_paragraph(doc, "where L_{affected} is the cumulative flooded roadway length (in km), \\mathcal{R}_{PMC} represents the complete road network database (7,445.90 km total baseline), and ST_Intersection yields the precise inundated sub-geometry of polyline r. Affected road segments are highlighted in vibrant Orange within the 3D twin canvas.")

    # 4.7 Depth Metrics and Scientific Caveats
    add_heading(doc, "4.7 Inundation Depth Metrics and Scientific Caveats", level=2)
    add_paragraph(doc, "The methodology treats simulated flood depth metrics with meticulous scientific transparency. In the automated pipeline, depth is calculated by subtracting underlying Copernicus DEM ground elevation values from the simulated horizontal flood surface elevation within inundated pixel columns. Consequently, across analytical output manifests, mean inundation depths behave realistically (scaling between 3.6m to 8.4m depending on storm severity).")
    add_paragraph(doc, "However, inspection of raw automated outputs reveals extreme local maximum depth anomalies (e.g., maximum depth records reaching 50.80m in Normal and 89.38m in Extreme scenarios). Methodologically, these inflated maximum values do not represent observed actual physical water column heights; rather, they are structural artifacts resulting from DEM vertical sinks, bridge/embankment interpolation errors in the 30-meter space, and steep canyon sidewall differentials inside discrete raster grid cells. Accordingly, throughout this dissertation and within the application software, depth metrics are formally defined as 'scenario-derived relative inundation depth estimates'. Practitioners are instructed to rely upon verified spatial surface area extents and vector intersection counts for quantitative decision-making.")

    # 4.8 Integrated Decision Support Modules
    add_heading(doc, "4.8 Integrated Spatial Decision Support Modules", level=2)
    add_paragraph(doc, "The analytical GIS and flood simulation layers are woven into an interoperable suite of decision-support components:")
    add_bullet_list(doc, [
        "3D Digital Twin Implementation: Constructed on CesiumJS (version 1.115), combining Cesium World Terrain with OSM 3D structural building geometries and ArcGIS World Imagery. The rendering pipeline synchronizes simulated raster overlays, dynamic rain visual effects, and choreographed cinematic cameras.",
        "Spatial Analytics & Decision Intelligence: A dedicated analytics engine aggregating real-time telemetry from project databases, presenting comparative KPI cards (flooded area, exposed structures, impacted road length) across scenario timelines.",
        "Predictive Spatial Intelligence: A scenario-forecasting module evaluating what-if progression timelines. (Note: In academic terminology, this represents rule-based statistical impact projection and multi-scenario comparison rather than trained black-box machine learning forecasting).",
        "GeoNarrative AI Assistant (Natural Language Geospatial Interaction): An innovative GeoAI integration employing Large Language Model (LLM) orchestration via Google Gemini API. Armed with specialized project context buffers, intent routers, and programmatic tools (such as query_planner and tool_agent), the assistant interprets complex natural-language queries (e.g., 'Which ward exhibits highest critical building exposure in extreme floods?') and executes direct spatial retrievals.",
        "Geospatial Technical Report Agent: An automated reporting studio that aggregates live real-time metrics from the analytics store and scenario metadata to generate structured technical dossiers, complete with vulnerability assessments and disaster mitigation recommendations."
    ])

    # 4.9 System Architecture
    add_heading(doc, "4.9 Enterprise Geospatial System Architecture", level=2)
    add_paragraph(doc, "The operational software architecture unifies multi-source geospatial ingestion pipelines with high-performance web presentation layers, illustrated in Figure 4.2 and detailed in Table 4.2.")

    add_mermaid_placeholder(doc, "Enterprise System Architecture", """graph TB
    subgraph DataSources ["Data Ingestion Tier"]
        DEM["Copernicus GLO-30 DEM"]
        LULC["Sentinel-2 LULC"]
        BOUND["PMC Boundary Polygon"]
        BLDG["180,307 OSM/PMC Buildings"]
        ROAD["55,309 OSM/PMC Roads"]
        WATER["171 Water Features"]
    end
    subgraph Processing ["Geospatial & Spatial Database Tier"]
        PG["PostGIS Spatial Geodatabase (SQL / ST_Intersects)"]
        AHP["Multi-Criteria AHP Susceptibility Engine (Rasterio / NumPy)"]
        FLOO["Temporal Flood Scenario Propagation Engine"]
        EXPO["Vector Infrastructure Exposure Pipeline (Shapely / GeoPandas)"]
    end
    subgraph Backend ["FastAPI Application Tier"]
        API["FastAPI REST & WebSocket Server (Python 3.11)"]
        GEOAI["GeoAI Orchestrator (Gemini Client + Context Builder + Tool Agent)"]
        REP["Technical Report Aggregation Service"]
    end
    subgraph Frontend ["Client Presentation Tier (Next.js 16 / React 19)"]
        TWIN["3D Digital Twin Engine (CesiumJS 1.115 + World Terrain)"]
        DASH["Geospatial Command Center & Live Analytics Store (Zustand)"]
        STUDIO["Report Agent Studio & Interactive GeoAI Copilot"]
    end
    DataSources --> Processing
    Processing <--> Backend
    Backend <--> Frontend""")

    add_figure_placeholder(doc, "4.2", "Enterprise Geospatial System Architecture of GeoNarrative AI", "Multi-tiered architecture connecting GIS pipelines, PostGIS geodatabases, FastAPI spatial servers, GeoAI tools, and Cesium 3D presentation clients.")

    add_table(doc,
        ["Software & Framework Component", "Version / Standard", "Methodological & Operational Role"],
        [
            ["Python / FastAPI Server", "Python 3.11 / FastAPI 0.109", "Asynchronous backend server hosting geospatial endpoints and simulation algorithms."],
            ["PostGIS / PostgreSQL", "PostGIS 3+ / PostgreSQL 15", "Relational geodatabase managing structural geometry storage and spatial index queries."],
            ["Rasterio / GeoPandas / Shapely", "1.3.x / 0.14.x / 2.0.x", "High-performance Python libraries for raster modeling and vector spatial intersection."],
            ["Next.js / React / TypeScript", "Next.js 16.x / React 19.x / TS 5.x", "Modern client frontend delivering type-safe, responsive enterprise UI architectures."],
            ["CesiumJS / World Terrain", "CesiumJS 1.115", "Web-based 3D globe visualization engine rendering realistic terrain and temporal imagery."],
            ["Zustand & Recharts", "Latest Enterprise Builds", "State synchronization across GIS modules and visual rendering of analytical charts."],
            ["Google Gemini API (GeoAI Engine)", "Gemini 1.5 Pro / Flash", "Generative AI language processing powering the conversational spatial intelligence copilot."]
        ],
        caption="Summary of Engineered Software Technology Stack",
        table_num="4.2"
    )

    # 4.10 Chapter Summary
    add_heading(doc, "4.10 Chapter Summary", level=2)
    add_paragraph(doc, "This chapter established the complete research methodology. By replacing obsolete static concepts with an enterprise geospatial pipeline, the methodology successfully coupled a 5-factor AHP weighted susceptibility model with a terrain-constrained temporal flood scenario engine. Exact spatial intersection algorithms were defined to evaluate vulnerability across 180,307 buildings and 7,445.90 km of roads within the 506.91 km² PMC boundary. Furthermore, the integration of conversational GeoAI and automated technical reporting was formalized, constructing an interdisciplinary bridge between spatial data science and operational decision-making. The technical software implementation of these architectural components is presented in Chapter 5.")

    add_page_break(doc)
