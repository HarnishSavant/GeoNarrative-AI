"""
Chapter 6: Results and Discussion
Rigorous presentation of quantitative GIS spatial outputs, verified scenario infrastructure exposure metrics, and interactive 3D Digital Twin application demonstrations
"""
from doc_setup import *

def write_chapter_6(doc):
    add_heading(doc, "Chapter 6: Empirical Results and Application Demonstration", level=1)

    add_heading(doc, "6.1 Introduction", level=2)
    add_paragraph(doc, "This chapter presents the verified empirical outcomes of the multi-criteria GIS flood susceptibility assessment, scenario-based infrastructure exposure modelling, and interactive software deployments. Adhering to standards of academic presentation, results are structured into three cohesive sections: Section 1 delineates static GIS spatial layers and AHP hazard stratification; Section 2 presents quantitative scenario progression outputs and vector infrastructure vulnerability metrics derived from analytical geodatabase intersections; Section 3 demonstrates the interactive 3D Digital Twin application, conversational GeoAI Assistant, and decision-support reporting interfaces.")

    # --- SECTION 1: GIS SPATIAL ANALYSIS & SUSCEPTIBILITY RESULTS ---
    add_heading(doc, "6.2 Study Area Extent and Curated Vector Baseline", level=2)
    add_paragraph(doc, "The operational study area corresponds strictly to the official Pune Municipal Corporation (PMC) administrative jurisdiction, encompassing an exact computed territorial extent of 506.91 square kilometers. Spatial geodatabase processing established geodetic bounding boxes ranging from 73.7319°E to 74.0184°E longitude and 18.3854°N to 18.6218°N latitude. Within this definitive municipal perimeter, spatial clipping procedures verified an operational inventory of 180,307 structural building footprints (covering 42.92 km² aggregate built-up surface area), 55,309 linear transportation road segments (7,445.90 km cumulative network length), and 171 permanent Mula-Mutha hydrological water channels (9.06 km² permanent water coverage).")

    add_figure_placeholder(doc, "6.1", "Verified territorial boundaries of the Pune Municipal Corporation (506.91 km²) overlaid with primary transportation corridors and water networks.")

    add_heading(doc, "6.3 Topographic Elevation and Slope Profiles", level=2)
    add_paragraph(doc, "Analysis of the Copernicus GLO-30 Digital Elevation Model across the PMC territory reveals substantial geomorphic variability. Absolute topographic elevations ascend from approximately 530 meters above mean sea level (MSL) within the eastern Mula-Mutha alluvial valley to over 820 meters MSL along western Sahyadri ridgelines and southern municipal hills. Derivative slope computations demonstrate that central city wards and riparian floodplains are dominated by planar terrain (<2.5° gradient), constituting primary geomorphic accumulation depressions for pluvial flood stagnation. In contrast, western periphery slopes display gradients ranging from 15.0° to 35.0°+, promoting rapid surface storm water discharge toward the central basin.")

    add_figure_placeholder(doc, "6.2", "Copernicus GLO-30 Digital Elevation Model (DEM) and continuous terrain slope gradient mapping across PMC study area.")

    add_heading(doc, "6.4 Land Use / Land Cover (LULC) Impermeability", level=2)
    add_paragraph(doc, "Sentinel-2 WorldCover multi-spectral classifications highlight a pronounced urban footprint. Dense impervious built-up surfaces dominate approximately 44% of the municipal expanse, heavily concentrated in central administrative wards and expanding eastern IT commercial corridors (such as Kharadi, Hadapsar, and Hinjewadi interfaces). Vegetated forest cover (~11%) and agricultural croplands (~16%) remain largely confined to elevated western margins and southern suburban zones. High surface impermeability dramatically diminishes natural soil infiltration capacities, generating elevated runoff coefficients during monsoon rainbursts.")

    add_figure_placeholder(doc, "6.3", "Sentinel-2 Land Use / Land Cover multi-spectral classification of the Pune Municipal Corporation territory.")

    add_heading(doc, "6.5 Multi-Criteria AHP Flood Susceptibility Stratification", level=2)
    add_paragraph(doc, "Executing the 5-factor AHP Weighted Overlay mathematical engine across standardized conditioning layers—Elevation (weight 0.35), Distance to Waterways (0.25), Slope Gradient (0.20), LULC Impermeability (0.10), and Building Density (0.10)—yielded a continuous Flood Susceptibility Index (FSI) distribution across the municipal landscape. Equal-interval categorical segmentation partitioned the continuous index ($1.0 \le FSI \le 5.0$) into five susceptibility classifications, summarized in Table 6.1.")

    add_table(doc,
        ["Susceptibility Classification", "FSI Numerical Interval", "Estimated Territorial Share (%)", "Primary Spatial Location Characteristics"],
        [
            ["Very Low Susceptibility", "1.00 – 1.80", "~18.4%", "Elevated western ridgelines and steep vegetated hill slopes."],
            ["Low Susceptibility", "1.80 – 2.60", "~21.7%", "Peripheral undulating suburban uplands with stable soil drainage."],
            ["Moderate Susceptibility", "2.60 – 3.40", "~24.8%", "Intermediate residential terraces and localized pluvial depressions."],
            ["High Susceptibility", "3.40 – 4.20", "~20.3%", "Low-lying impervious commercial zones adjacent to drainage streams."],
            ["Very High Susceptibility", "4.20 – 5.00", "~14.8%", "Immediate Mula-Mutha river corridors and low-elevation alluvial plains."]
        ],
        caption="Categorical Flood Susceptibility Distribution across Pune Municipal Corporation",
        table_num="6.1"
    )

    add_paragraph(doc, "Spatial analysis of the resulting susceptibility mapping demonstrates exceptional geomorphological coherence. Areas categorized as Very High and High susceptibility concentrate strictly along the low-lying Mula-Mutha fluvial corridors and central impervious commercial centers, correlating strongly with historical documented inundation boundaries observed during the catastrophic September 2019 and July 2024 monsoon flood events. Conversely, elevated western peripheries display predominantly Low to Very Low risk profiles due to rapid gravitational drainage momentum.")

    add_figure_placeholder(doc, "6.4", "Comprehensive Multi-Criteria Flood Susceptibility Map of Pune City categorized into five distinct risk zones.")

    # --- SECTION 2: SCENARIO FLOOD PROGRESSION & EXPOSURE METRICS ---
    add_heading(doc, "6.6 Scenario-Based Flood Progression and Infrastructure Exposure", level=2)
    add_paragraph(doc, "To advance beyond static susceptibility mapping, the terrain-constrained temporal flood scenario engine executed simulations across four graded meteorological severity levels: Normal, Moderate, Heavy, and Extreme. Automated spatial intersection algorithms (ST_Intersects) executed in UTM Zone 43N projected space quantified precise structural asset exposure across all 180,307 municipal buildings and 55,309 road segments. The authoritative empirical findings, extracted from verified data pipeline manifests (scenario_comparison.json), are detailed in Table 6.2.")

    add_table(doc,
        ["Simulation Scenario ID", "Temporal Duration", "Inundated Flood Area (km²)", "Max Relative DEM Diff (m)", "Affected Buildings (Count)", "Critical Buildings (<30m Buffer)", "Affected Road Length (km)"],
        [
            ["Normal Scenario", "30 Frames (15s)", "53.60 km²", "50.80 m*", "11,262 units", "8,808 units", "751.19 km"],
            ["Moderate Scenario", "35 Frames (20s)", "70.01 km²", "65.57 m*", "15,903 units", "12,154 units", "981.11 km"],
            ["Heavy Scenario", "40 Frames (30s)", "89.72 km²", "64.06 m*", "24,210 units", "18,618 units", "1,257.43 km"],
            ["Extreme Scenario", "45 Frames (45s)", "133.97 km²", "89.38 m*", "40,723 units", "32,084 units", "1,877.47 km"]
        ],
        caption="Authoritative Scenario Comparison and Quantitative Infrastructure Exposure Metrics in Pune City",
        table_num="6.2"
    )

    add_paragraph(doc, "(*Note on Depth Interpretability: As formalized in Chapter 4, maximum recorded depth values represent scenario-derived relative DEM elevation differences over flooded cells rather than field-calibrated water column depths. Extreme maximum values—such as 89.38m in Extreme scenarios—originate from vertical DEM sink artifacts and steep river valley sidewalls within discrete 30m Copernicus grid cells. Practitioners must prioritize validated areal extents and vector intersection counts for disaster mitigation planning.)")
    add_paragraph(doc, "The empirical outputs confirm a strict monotonic escalation in hazard severity as meteorological scenarios intensify. Under basic Normal flood conditions, temporary inundation covers 53.60 km² (representing 10.57% of total PMC area), impacting 11,262 building structures—8,808 of which lie immediately within high-risk 30-meter riparian buffers—and submerging 751.19 km of road network. When projected under Extreme severe weather simulations, inundated flood extents rapidly expand to 133.97 km² (26.43% of PMC territory). Under this worst-case scenario, affected structural building footprints jump to 40,723 units (a 261% increase over normal levels), with critical riparian structural exposure reaching 32,084 structures and transportation corridor disruption spanning 1,877.47 kilometers of roadway. These precise empirical intersections underline the necessity of dynamic scenario modeling for emergency resource allocation.")

    add_figure_placeholder(doc, "6.5", "Comparative bar chart illustrating affected building counts and road network disruption across the four simulated storm scenarios.")

    # --- SECTION 3: APPLICATION DEMONSTRATION & UI ARCHITECTURE ---
    add_heading(doc, "6.7 Application Demonstration: 3D Digital Twin & Decision Intelligence", level=2)
    add_paragraph(doc, "The functional capacity of the GeoNarrative AI application framework was verified across interactive web modules. The software combines professional enterprise UI design with low-latency rendering of geospatial simulations.")

    add_heading(doc, "6.7.1 Geospatial Command Center & GIS Layer Management", level=3)
    add_paragraph(doc, "The primary dashboard interface functions as an integrated Geospatial Command Center. Engineered with a dark theme tailored for high-contrast multi-layer visualization, the workspace integrates interactive GIS controls that allow operators to toggle foundational spatial layers—Copernicus DEM elevation relief, building footprints, road polylines, and the five-tier AHP susceptibility grid—directly onto the map canvas. Live telemetry status cards dynamically report spatial database metrics without reliance on static placeholders.")

    add_screenshot_placeholder(doc, "6.6", "Geospatial Command Center exhibiting integrated layer controls, active GIS layers, and real-time database metric indicators.")

    add_heading(doc, "6.7.2 Interactive 3D Digital Twin and Temporal Simulation Playback", level=3)
    add_paragraph(doc, "Within the 3D Digital Twin module, CesiumJS renders volumetric urban morphology by draping 3D OSM structure polygons over Cesium World Terrain. Upon triggering a simulation scenario (e.g., Heavy Rainfall, 80–150mm), the temporal raster overlay engine smoothly propagates inundated water rasters outward from the 171 permanent river features across consecutive simulation frames. Affected building polygons intersected by the floodwater boundary automatically transition rendering shaders to Yellow hazard states, while Critical structures within 30-meter river buffers burn vibrant Red. Simultaneously, the cinematic camera choreography executes automated spline flight paths, guiding planners through impacted municipal corridors.")

    add_screenshot_placeholder(doc, "6.7", "3D Digital Twin View capturing animated temporal flood progression, Red critical building overlays, and flooded road corridors.")

    add_heading(doc, "6.7.3 Conversational GeoAI Assistant & Technical Report Agent Studio", level=3)
    add_paragraph(doc, "The natural language decision support interface demonstrates real-time conversational GeoAI capabilities powered by Google Gemini. When tasked with administrative inquiries such as 'Identify total road disruption and critical building impacts under extreme flood scenarios in Pune,' the AI Assistant extracts parameters from active simulation stores and responds with quantitative analytical intelligence. Using autonomous tool routing, the copilot executes map command shifts and spatial filter adjustments instantly upon user request.")
    add_paragraph(doc, "Complementing the AI copilot, the Geospatial Technical Report Agent studio generates publication-grade structural risk reports. Configured directly from live application state telemetry, the Report Agent compiles comparative scenario statistics into formatted dossiers incorporating vulnerability matrices and mitigation guidelines, bridging software computations with formal municipal governance workflows.")

    add_screenshot_placeholder(doc, "6.8", "Interactive GeoAI Assistant copilot panel and automated Technical Report Agent studio generating disaster briefings.")

    # 6.8 Scholarly Discussion
    add_heading(doc, "6.8 Scholarly Discussion of Findings", level=2)
    add_paragraph(doc, "The empirical results substantiate the core argument of this thesis: coupling multi-criteria GIS analytical modeling with dynamic 3D Digital Twin visualization and conversational AI significantly elevates geospatial decision-making. Whereas conventional static susceptibility mapping stops at delineating potential hazard zones, the implemented temporal scenario pipeline quantifies explicit structural vulnerabilities—accurately pinpointing the progression from 11,262 affected buildings in basic events up to 40,723 endangered structures during extreme flooding.")
    add_paragraph(doc, "The integration of natural language AI processing overcomes technical proficiency obstacles historically impeding traditional GIS desktops. By enabling decision-makers to interrogate spatial models via natural conversational interactions, GeoNarrative AI successfully democratizes complex hazard intelligence, advancing urban disaster risk communication into a dynamic, interactive paradigm.")

    # 6.9 Chapter Summary
    add_heading(doc, "6.9 Chapter Summary", level=2)
    add_paragraph(doc, "This chapter presented the empirical findings of the GeoNarrative AI framework. Spatial multi-criteria analysis established a five-tier flood susceptibility map across the 506.91 km² PMC territory, matching historical flood distributions. Temporal scenario simulations quantified exact structural disaster exposure across 180,307 buildings and 7,445.90 km of roadway, confirming monotonic risk expansion up to 133.97 km² of inundation and 40,723 affected buildings under extreme conditions. Finally, interactive application demonstrations verified the integration of 3D Digital Twin animations, conversational GeoAI assistance, and automated technical reporting. Chapter 7 extends these findings into a critical evaluation of methodological insights, contributions to spatial science, and practical municipal applications.")

    add_page_break(doc)
