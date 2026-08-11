"""
Chapter 5: System Software Implementation and Architectural Engineering
Focused on enterprise backend services, spatial database integration, interactive 3D Digital Twin frontend, GeoAI copilot, and analytical modules
"""
from doc_setup import *

def write_chapter_5(doc):
    add_heading(doc, "Chapter 5: System Software Implementation and Architectural Engineering", level=1)

    add_heading(doc, "5.1 Introduction", level=2)
    add_paragraph(doc, "This chapter details the software engineering methodologies and structural architectural implementations executed to construct the GeoNarrative AI Spatial Decision Support System (SDSS). Translating the quantitative multi-criteria models and vector exposure equations established in Chapter 4 into a responsive enterprise web application required engineering an asynchronous client-server pipeline. The discussion examines the backend geospatial processing engine, PostgreSQL/PostGIS spatial database integration, interactive 3D frontend visualization mechanics, generative AI orchestrator implementations, and practical software engineering optimizations.")

    # 5.2 GIS Analysis Pipeline & Database Engine
    add_heading(doc, "5.2 GIS Analysis Pipeline and Spatial Database Engine", level=2)
    add_paragraph(doc, "The automated GIS analysis pipeline was constructed in Python 3.11, leveraging industrial-grade libraries: Rasterio and NumPy for multidimensional raster transformations, alongside GeoPandas, Shapely, and Pyproj for high-speed vector topological operations and geodetic coordinate transformations.")

    add_heading(doc, "5.2.1 Geodatabase Ingestion and Topology Cleaning", level=3)
    add_paragraph(doc, "Raw vector survey layers extracted from municipal enterprise databases (MyProject8.gdb) were ingested via Fiona layer enumerations and structured into localized GeoDataFrames. To guarantee computational stability during complex vector-raster overlay operations, programmatic geometry scrubbers executed strict geometry validation protocols (make_valid()), rectifying topological anomalies such as degenerate multi-polygon rings and sliver self-intersections. Verified layers were standardized to World Geodetic System 1984 (EPSG:4326) and persistent index tables were generated within a PostGIS 3 extension running over PostgreSQL 15.")

    add_heading(doc, "5.2.2 Algorithmic Spatial Factor Computation & Weighted Overlay", level=3)
    add_paragraph(doc, "The five core conditioning factors—Elevation, Distance to River, Terrain Slope, LULC impermeability, and Building Footprint Density—were computed via automated scripted pipelines. Continuous elevation matrices and gradient derivations were extracted from Copernicus GLO-30 rasters. For metric riparian distances, geometries were reprojected to Universal Transverse Mercator (UTM) Zone 43N (EPSG:32643), where Euclidean proximity arrays were computed against the 171 permanent Mula-Mutha water features.")
    add_paragraph(doc, "The AHP Weighted Overlay engine implemented vectorized array multiplications using NumPy. Normalized factor score layers ($S_{i,j} \in [1, 5]$) were modulated by their corresponding criterion weights (Elevation 0.35, Distance to River 0.25, Slope 0.20, LULC 0.10, Building Density 0.10) and summed sequentially to establish the continuous Flood Susceptibility Index ($FSI_i$). Outputs were subsequently segmented via equal interval boundaries into five categorical hazard zones and rendered as optimized GeoJSON and raster tilesets for web distribution.")

    # 5.3 Backend Application Server & Microservices
    add_heading(doc, "5.3 Backend Application Server and Spatial Microservices", level=2)
    add_paragraph(doc, "The enterprise server architecture was built upon FastAPI (version 0.109), an asynchronous Python web framework providing automatic REST OpenAPI schema documentation, rigorous Pydantic type validation, and high-concurrency non-blocking request routing. The backend functions as a modular spatial middleware, connecting raw database execution engines with client UI applications.")

    add_table(doc,
        ["Backend Microservice Module", "Architectural Responsibility and Technical Capability"],
        [
            ["gis_engine.py", "Executes multi-criteria factor standardizations, AHP weighted overlays, and dynamic raster transformations."],
            ["flood_scenario_service.py", "Orchestrates temporal flood propagation manifests and coordinates time-series raster generation."],
            ["vector_exposure_service.py", "Performs spatial intersection queries (ST_Intersects) across 180,307 buildings and 55,309 road segments."],
            ["ai_assistant_service.py", "Manages Google Gemini LLM API client sessions, maintains conversation buffers, and routes tool executions."],
            ["report_agent_service.py", "Aggregates real-time analytical telemetry and formats structured decision-support engineering briefs."],
            ["analytics_service.py", "Compiles scenario KPI comparisons and serves historical baseline telemetry to frontend state stores."]
        ],
        caption="Backend Application Microservice Modules",
        table_num="5.1"
    )

    # 5.4 3D Digital Twin Frontend Engine
    add_heading(doc, "5.4 3D Digital Twin Frontend Engine and UI Architecture", level=2)
    add_paragraph(doc, "The presentation layer was engineered in Next.js 16 using React 19 functional architecture and strict TypeScript 5 type declarations, establishing a robust modular frontend. Global application state synchronization—governing active scenario parameters, camera coordinates, and analytical metric feeds—is managed via Zustand enterprise state stores.")

    add_heading(doc, "5.4.1 CesiumJS Terrain Integration & Rendering Pipeline", level=3)
    add_paragraph(doc, "Interactive three-dimensional spatial visualization is powered by CesiumJS (version 1.115). The virtual globe canvas instantiates Cesium World Terrain, which supplies accurate topographic relief modeling with vertex normals and water body clipping masks. High-resolution satellite orthophotos (ArcGIS World Imagery) are draped as surface texturing overlays. Structural urban geometry is projected natively via OSM 3D Buildings tilesets, rendering volumetric approximations of municipal architectures across Pune.")
    add_paragraph(doc, "To achieve optical realism during flood scenarios, GPU depth testing against ground terrain (depthTestAgainstTerrain = true) is programmatically enforced. This ensures that simulated floodwater rasters conform physically to terrain morphology, pooling realistically within low-elevation riparian corridors while elevated ridges remain visually exposed.")

    add_heading(doc, "5.4.2 Temporal Flood Scenario Simulation Engine", level=3)
    add_paragraph(doc, "Superseding legacy experimental iterations that employed basic vertical translation of horizontal circular primitives (such as EllipseGeometry), the operational system incorporates a specialized temporal raster scenario rendering engine. The simulation is coordinated via an event-driven timeline director managing four synchronized sub-modules:")
    add_numbered_list(doc, [
        "Simulation Director: Governs the global simulation clock and event dispatcher. It coordinates temporal state progression across discrete frames for each scenario: Normal (30 frames, 15s duration), Moderate (35 frames, 20s duration), Heavy (40 frames, 30s duration), and Extreme (45 frames, 45s duration).",
        "Temporal Raster Overlay Engine: Dynamically streams precomputed transparent PNG flood inundation tiles generated by the backend propagation engine. To deliver seamless temporal continuity during scenario playback, the engine performs alpha crossfade interpolations between sequential spatial frames, preserving hydrological monotonicity as flood extents expand.",
        "Infrastructure Impact Visualizer: Interacts with 3D structural tilesets to visually signal hazard exposure. When flood raster boundaries encompass structural coordinates, impacted building geometries transition their rendering shaders to hazard indicators (Yellow for Affected structures; vibrant Red for Critical riparian structures within 30m buffers). Affected road segments similarly render in high-contrast Orange polylines.",
        "Cinematic Camera Choreographer: Controls orbital viewing perspectives via spline path interpolations. The automated camera director transitions seamlessly from macroscopic city-wide overviews down to low-altitude tracking flights along the Mula-Mutha riverine corridor during critical simulated flood bursts."
    ])

    # 5.5 Integrated AI and Decision Support Implementation
    add_heading(doc, "5.5 Integrated GeoAI and Decision-Support Implementations", level=2)
    add_paragraph(doc, "A core innovation of GeoNarrative AI is the synthesis of conversational artificial intelligence directly within the geospatial decision loop, designed to lower technical barriers for municipal administrators.")

    add_heading(doc, "5.5.1 Conversational GeoAI Assistant Implementation", level=3)
    add_paragraph(doc, "The AI Assistant module integrates Google's generative Gemini LLM APIs via an enterprise conversational orchestrator (ai_assistant_service.py). When a user inputs a natural language query (e.g., 'Compare critical building vulnerability between Moderate and Extreme storm scenarios in Pune'), the service prepends a project-aware context buffer embedding validated municipal data schemas, scenario metric comparisons, and GIS dictionary abbreviations.")
    add_paragraph(doc, "Furthermore, the AI engine implements autonomous tool routing capabilities. Equipped with function interfaces including query_planner, tool_agent, layer_toggle, and set_simulation_scenario, the model dynamically triggers client UI changes or executes PostGIS spatial SQL queries in real time, transforming static chatbots into active geospatial co-pilots.")

    add_heading(doc, "5.5.2 Analytics Dashboard & Technical Report Agent", level=3)
    add_paragraph(doc, "The Command Analytics Dashboard consumes live RESTful telemetry from the backend pipeline, rendering synchronized interactive charts via the Recharts visualization library. As temporal simulations advance, KPI cards display verified ground-truth computations: inundated surface areas, impacted building counts, critical riparian exposures, and cumulative road disruptions.")
    add_paragraph(doc, "Complementing live telemetry, the automated Technical Report Agent module acts as an analytical synthesizer. Upon user invocation, the agent queries active simulation states and compiles comprehensive technical disaster briefings, structuring executive summaries, vulnerability matrices, and actionable flood mitigation recommendations formatted for immediate administrative adoption.")

    # 5.6 Engineering Solutions & Optimizations
    add_heading(doc, "5.6 Engineering Challenges and System Optimizations", level=2)
    add_paragraph(doc, "During architectural deployment, significant engineering challenges were resolved through rigorous structural optimizations:")
    add_numbered_list(doc, [
        "ECMAScript Syntax and CORS Security Harmonization: During enterprise frontend builds, JSX compiler exceptions triggered by raw unescaped structural symbols (e.g., raw UI comparator operators '<30m') within React components were systematically mitigated by applying standard HTML entity escaping (&lt;30m). Concurrently, robust CORS (Cross-Origin Resource Sharing) middleware configurations were established across FastAPI endpoints to allow secure bi-directional telemetry streaming with Next.js client ports.",
        "Memory Management in 3D Tile Rendering: Simultaneous GPU rendering of high-resolution World Terrain, 180,307 volumetric 3D building polygons, and dynamic multi-frame PNG flood overlays initially created heap memory saturation and frame-rate degradation. This was overcome by implementing tile frustum culling, progressive LOD (Level of Detail) transitions, and pre-allocated object memory pools within Cesium render loops, stabilizing runtime execution at an ideal 60 frames per second.",
        "Asynchronous GeoJSON Stream Optimization: Transmitting extensive vector geometries over HTTP lines risked interface freezing. To optimize bandwidth and responsiveness, the backend GIS engine integrated gzip payload compression and pagination protocols, while heavy spatial intersection calculations were offloaded to asynchronous backend thread pools."
    ])

    # 5.7 Chapter Summary
    add_heading(doc, "5.7 Chapter Summary", level=2)
    add_paragraph(doc, "This chapter described the technical software implementation of the GeoNarrative AI framework. By coupling an asynchronous FastAPI backend and PostGIS database engine with a Next.js 16 and CesiumJS 3D frontend, the system transforms theoretical spatial equations into a responsive analytical web platform. The incorporation of Gemini-powered conversational GeoAI and automated technical reporting capabilities establishes a comprehensive decision-support ecosystem for urban disaster preparedness. Chapter 6 presents the quantitative spatial results and application interface demonstrations produced by this implemented framework.")

    add_page_break(doc)
