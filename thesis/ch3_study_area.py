"""
Chapter 3: Study Area and Data Catalog
Focused on geographic, meteorological, hydrological, and infrastructural profile of Pune Municipal Corporation (PMC)
"""
from doc_setup import *

def write_chapter_3(doc):
    add_heading(doc, "Chapter 3: Study Area and Data Catalog", level=1)

    add_heading(doc, "3.1 Introduction", level=2)
    add_paragraph(doc, "The precise geographical bounding of a study area and rigorous inventorying of corresponding spatial datasets form the foundation of reproducible geospatial analytical research. The physical characteristics of the terrain—comprising topographic variation, hydrological drainage patterns, meteorological regimes, and anthropogenic impervious surfaces—directly dictate the parametric formulations of flood susceptibility models and exposure algorithms. This chapter characterizes the geographic, meteorological, hydrological, and demographic profile of the Pune Municipal Corporation (PMC) administrative extent. Furthermore, it details the technical metadata of all primary raster and vector geospatial datasets curated for this research.")

    # 3.2 Location and Administrative Extent
    add_heading(doc, "3.2 Location and Administrative Extent", level=2)
    add_paragraph(doc, "The city of Pune is located in the western sector of the state of Maharashtra, India, situated on the leeward plateau of the Sahyadri mountain range (Western Ghats). While the broader urban agglomeration encompassing the Pune Metropolitan Region Development Authority (PMRDA) spans extensive territory, the analytical extent of this study is strictly confined to the official administrative boundary of the Pune Municipal Corporation (PMC).")
    add_paragraph(doc, "The finalized PMC study area covers a computed geographical footprint of approximately 506.91 km². In spatial coordinate space, the municipal extent lies within geodetic bounding latitudes of 18.3854°N to 18.6218°N and longitudes of 73.7319°E to 74.0184°E (referenced to World Geodetic System 1984, EPSG:4326). The municipal boundary vector polygon, curated from verified administrative geodatabases (PMC.geojson), serves as the definitive spatial clipping mask and analytic framework for all multi-criteria evaluations and infrastructure intersections.")

    add_figure_placeholder(doc, "3.1", "Geographic location and administrative boundary of Pune Municipal Corporation (506.91 km²) within Maharashtra, India.")

    # 3.3 Climate and Meteorological Regime
    add_heading(doc, "3.3 Climate and Meteorological Regime", level=2)
    add_paragraph(doc, "Pune falls within a tropical wet-and-dry climatic regime (Köppen climate classification Aw), exhibiting three distinct seasons: a high-temperature pre-monsoon summer from March to May, the southwest monsoon season extending from June to September, and a moderate winter from October to February. The southwest monsoon dominates the annual regional hydrological cycle, contributing approximately 85% of the annual precipitation, which averages 722 mm across the urban basin but regularly exceeds 1,100 mm during intense cyclonic or active monsoon years.")
    add_paragraph(doc, "Precipitation distribution across the region displays pronounced spatial heterogeneities. Western catchments positioned adjacent to the topographical barrier of the Western Ghats receive markedly higher atmospheric moisture deposition due to strong orographic uplift. Consequently, extreme rainfall occurrences in western up-country basins generate rapid overland storm volumes that drain eastward directly through the urban channels of Pune.")
    add_paragraph(doc, "Recent climate patterns indicate a quantifiable shift toward short-duration, extreme precipitation bursts. Notable historical disaster events—such as the intense cloudburst and river flooding of September 2019 (exceeding 200 mm precipitation within 24 hours) and severe pluvial inundation events in July–August 2024—resulted in severe transport disruptions, infrastructure loss, and evacuation of riparian communities. These meteorological characteristics underscore the necessity of scenario-driven simulation capabilities capable of representing extreme rainfall intensities.")

    # 3.4 Hydrological Network and Water Resources
    add_heading(doc, "3.4 Hydrological Network and Riparian Morphology", level=2)
    add_paragraph(doc, "The natural surface hydrology of Pune is structurally defined by the Mula-Mutha river system and its dense secondary tributary channels. The Mutha river enters the urban extent from the west (regulated by the upstream Khadakwasla and Mulshi dam reservoirs), while the Mula river penetrates from the northwest (regulated by the Pavana and Mulshi alignments). The two prominent waterways converge at Sangamwadi within the urban center, forming the joint Mula-Mutha river, which subsequently traverses eastward toward the Bhima river basin.")
    add_paragraph(doc, "For this study, hydrological features were extracted from verified hydrographic layers, yielding 171 primary permanent water body and stream channel polygon features within the PMC boundary. Combined, these permanent aqueous features account for an observed surface water baseline area of approximately 9.06 km². Proximity to these 171 channels constitutes a major weighting criterion in the analytical susceptibility framework, representing direct lateral exposure to riparian overflow during peak dam discharges or high-volume rainfall runoff.")

    add_figure_placeholder(doc, "3.2", "Spatial mapping of permanent Mula-Mutha hydrological corridors and primary municipal water features (171 features spanning 9.06 km²).")

    # 3.5 Topographic Profiles and Elevation
    add_heading(doc, "3.5 Topographic Profile and Terrain Morphology", level=2)
    add_paragraph(doc, "The topographic landscape of the PMC area exhibits significant geomorphological variance. Elevation values ascend rapidly toward western hills and southern ridgelines, reaching altitudes upwards of 820 meters above mean sea level (MSL). Conversely, the central urban valley and Mula-Mutha riparian plains transition across relatively planar alluvial terrain at elevations between 530 and 560 meters MSL.")
    add_paragraph(doc, "To model these physical variations mathematically, digital surface topography was procured from the Copernicus GLO-30 Digital Elevation Model, offering global standardized coverage at approximately 30-meter horizontal spatial resolution. Parametric raster surface derivatives—specifically continuous slope gradients (degrees) and topographic curvature—were computed directly from the Copernicus elevation matrix. Low-lying planar valley formations exhibit minimal hydraulic gravitational drainage momentum, forming primary spatial accumulation zones for pluvial ponding and overbank floods.")

    add_table(doc,
        ["Terrain Parameter", "Value Range", "Geomorphological & Hydrological Relevance"],
        [
            ["Elevation Altitude", "530 – 820+ meters MSL", "Lowest elevations define natural accumulation basins and floodplain limits."],
            ["Slope Gradient", "0.0° – 35.0°+", "Planar terrain (<2.5°) promotes pluvial stagnation; steep slopes (>15°) accelerate flash runoff."],
            ["Riparian Corridor", "530 – 555 meters MSL", "Primary fluvial discharge valley bounding central municipal wards."]
        ],
        caption="Summary of Topographic and Geomorphological Parameters in the PMC Study Area",
        table_num="3.1"
    )

    # 3.6 Land Use and Urbanization
    add_heading(doc, "3.6 Land Use / Land Cover (LULC) and Surface Impermeability", level=2)
    add_paragraph(doc, "Over the past three decades, the PMC territory has experienced expansive demographic and structural transformation driven by rapid industrial growth and commercial information technology development. This rapid urban expansion has systematically converted historical agricultural land, vegetated natural scrublands, and riparian buffers into dense impervious built environments.")
    add_paragraph(doc, "To evaluate urban impermeability, high-resolution remote sensing Land Use / Land Cover (LULC) raster arrays were extracted at 10-meter pixel resolution from European Space Agency (ESA) Sentinel-2 multi-spectral classifications. Built-up surfaces dramatically suppress soil hydraulic infiltration capacity, resulting in localized surface runoff coefficients approaching 0.85 to 0.95. This rapid transformation of rainfall into surface runoff substantially intensifies peak discharges entering urban drainage networks.")

    # 3.7 Demographic Trends
    add_heading(doc, "3.7 Demographics and Urban Vulnerability", level=2)
    add_paragraph(doc, "The population residing within the Pune municipal territory has scaled rapidly, growing from approximately 3.1 million in the 2011 decennial census to an estimated population exceeding 5.2 million across the expanded PMC jurisdiction by 2025. Demographic density within older central urban wards (such as Kasba Peth, Sadashiv Peth, and Shivajinagar) exceeds 25,000 persons per square kilometer. High residential density positioned within low-elevation riparian zones increases socio-economic vulnerability during sudden inundation episodes, requiring robust spatial decision tools.")

    # 3.8 Curated Geospatial Data Catalog
    add_heading(doc, "3.8 Curated Geospatial Data Catalog", level=2)
    add_paragraph(doc, "A comprehensive spatial geodatabase was compiled by processing multi-source remote sensing arrays and vector structural surveys. To ensure total scientific reproducibility, the vector layers representing urban lifelines and structural buildings were curated from comprehensive municipal surveys (MyProject8.gdb) and precisely clipped to the definitive PMC administrative boundary.")
    add_paragraph(doc, "The structural building inventory originally encompassed 339,732 regional source features; post-clipping to the PMC operational boundary yielded an analytical dataset of exactly 180,307 municipal building footprints covering an aggregate built structural area of approximately 42.92 km². Similarly, the transportation linear network layer comprises exactly 55,309 road network segments, spanning a cumulative operational distance of 7,445.90 kilometers within PMC boundaries. A detailed specification of the integrated dataset catalog is summarized in Table 3.2.")

    add_table(doc,
        ["Dataset Element", "Source Institution / Platform", "Resolution / Scale", "Verified Analytical Metrics (Inside PMC)"],
        [
            ["Administrative Boundary", "PMC GIS / OpenStreetMap", "Vector Polygon", "506.91 km² territorial extent (PMC.geojson)"],
            ["Digital Elevation Model", "Copernicus GLO-30 (ESA)", "30-meter Grid Raster", "Continuous elevation matrix (530m to 820m)"],
            ["LULC Classification", "Sentinel-2 WorldCover (ESA)", "10-meter Pixel Raster", "Multi-class surface impermeability categorization"],
            ["Building Footprints", "MyProject8.gdb / PMC Surveys", "Object Vector Polygon", "180,307 building structures (~42.92 km² footprint area)"],
            ["Road Network Segments", "OpenStreetMap / PMC Routing", "Vector Polyline", "55,309 roadway segments (7,445.90 km total length)"],
            ["Permanent Hydrology", "Hydrographic Vector Database", "Vector Polygon / Line", "171 water bodies and rivers (9.06 km² permanent water area)"]
        ],
        caption="Technical Specifications of Curated Geospatial Data Catalog for Pune Municipal Corporation",
        table_num="3.2"
    )

    # 3.9 Justification
    add_heading(doc, "3.9 Justification for Study Area Selection", level=2)
    add_paragraph(doc, "The selection of the Pune Municipal Corporation extent as the analytical testbed is justified by several academic and practical considerations:")
    add_numbered_list(doc, [
        "Hydrological Hazard Severity: Recent severe monsoon flooding events (2019, 2024) provide documented empirical evidence of severe vulnerability across low-lying municipal sectors.",
        "Geomorphological Complexity: The juxtaposition of steep western hills with planar central floodplains presents an ideal topographic testing environment for evaluating multi-criteria spatial conditioning models.",
        "Data Quality and Completeness: High-resolution Copernicus terrain grids combined with comprehensive structural building footprint polygons (180,307 geometries) enable precise vector-raster computational intersections without relying upon estimated proxy formulas.",
        "Policy and Smart City Relevance: As a prominent municipal administration undergoing rapid Smart City transformations, PMC derives immediate operational value from integrating interactive 3D digital twins and natural language GeoAI decision frameworks."
    ])

    # 3.10 Summary
    add_heading(doc, "3.10 Chapter Summary", level=2)
    add_paragraph(doc, "This chapter established the geographical, topographical, and hydrological characteristics of the Pune Municipal Corporation study area (506.91 km²). Furthermore, it cataloged the analytical datasets engineered into the project geodatabase, verifying exact building counts (180,307 units), transportation segments (55,309 lines spanning 7,445.90 km), and hydrological water features (171 bodies, 9.06 km²). These verified spatial layers serve as the foundational inputs for the analytical methodologies detailed in Chapter 4.")

    add_page_break(doc)
