# Urban Flood Susceptibility Model: Multi-Criteria Decision Analysis (MCDA)
**Research Methodology for Pune Metropolitan Digital Twin**

## 1. Introduction and Objectives
Urban flooding is a complex, non-linear phenomenon driven by hydrometeorological events, topographical constraints, and anthropogenic alterations to land cover. The objective of this model is to generate a **Flood Susceptibility Index (FSI)** using a Multi-Criteria Decision Analysis (MCDA) framework integrated natively into a PostGIS Spatial Database. This forms the predictive hydrologic layer of the Pune Digital Twin.

## 2. Factor Selection and Scientific Justification
The MCDA model utilizes five critical criteria, extensively validated in hydrological literature (e.g., *Rahmati et al., 2016; Wang et al., 2011*):

1. **Elevation (from `dem_raster`)**: Lower elevations inherently act as sink areas where surface runoff accumulates due to gravity.
2. **Slope (from `dem_slope`)**: Flat terrain (low slope) retards surface water flow, significantly increasing the probability of water ponding and inundation.
3. **Distance to Waterways (`distance_to_waterways`)**: Proximity to primary drainage channels determines riverine/fluvial flood risk. Areas closest to channels have the highest vulnerability to overbank flows.
4. **Land Use / Land Cover (`lulc_raster`)**: High-imperviousness surfaces (built-up areas) generate significantly higher surface runoff volumes and peak discharges compared to forested or agricultural zones, as natural infiltration is eliminated.
5. **Building Density (`building_density`)**: Serves as a proxy for both anthropogenic impact on natural drainage and socio-economic vulnerability. High building density intensifies urban pluvial flooding due to blocked flow paths and aging stormwater infrastructure.

## 3. Analytical Hierarchy Process (AHP) Weights
To quantify the relative importance of each factor, an AHP methodology (Saaty, 1980) was applied. Based on standard hydrologic impact assessments in monsoonal urban environments, the following normalized weights are assigned:

| Criterion | Weight | Justification |
|-----------|--------|---------------|
| **Elevation** | 0.35 | Primary driver of gravitational water accumulation. |
| **Distance to Waterways** | 0.25 | Fluvial proximity is the strongest predictor of severe inundation in Pune. |
| **Slope** | 0.20 | Determines flow velocity vs. ponding probability. |
| **LULC** | 0.10 | Modifies infiltration and runoff generation. |
| **Building Density** | 0.10 | Modifies surface roughness and represents impact magnitude. |

## 4. Weighted Overlay Methodology (FSI Equation)
All criteria are normalized on a `0.0` to `1.0` continuous scale, where `1.0` represents maximum flood susceptibility. 
The continuous **Flood Susceptibility Index (FSI)** is calculated as:

```math
FSI = (0.35 \times Elev_{norm}) + (0.25 \times Dist_{norm}) + (0.20 \times Slope_{norm}) + (0.10 \times LULC_{norm}) + (0.10 \times BldgDens_{norm})
```

The continuous score is then classified using Equal Intervals into standard risk matrices:
- **Very Low** (FSI < 0.2)
- **Low** (0.2 - 0.4)
- **Moderate** (0.4 - 0.6)
- **High** (0.6 - 0.8)
- **Very High** (FSI > 0.8)

## 5. PostGIS Implementation Strategy
Instead of exporting data to external GIS software (ArcGIS/QGIS), the entire MCDA matrix is computed **in-database** using the 500-meter analytical hexagon grid (`analytics_hex_features`). 
1. `ST_Value` evaluates the continuous rasters (DEM, Slope, LULC) at each hexagon centroid.
2. The attributes are linearly normalized using `MAX()` and `MIN()` subqueries.
3. The FSI is mathematically computed and written to a new spatial table `flood_susceptibility`.

## 6. Validation Methodology
Validation of the FSI model will require comparing the derived 'High' and 'Very High' susceptibility zones against historical inundation records.
1. **Empirical Validation**: Overlay historical flood point data (e.g., Pune 2019 flood extent) using `ST_Intersects` to compute the Area Under the Curve (AUC) of the Receiver Operating Characteristic (ROC).
2. **Sensitivity Analysis**: Systematically remove one factor at a time (One-At-A-Time analysis) to observe the variance in susceptibility classification.

## 7. Digital Twin Integration
By finalizing this model natively in PostGIS, it becomes an immediately operational layer for the Digital Twin:
- **GeoAI Agents** can instantly query risk: `SELECT risk_class FROM flood_susceptibility WHERE ST_Intersects(geometry, 'POINT(lon lat)')`.
- **Urban Planning APIs** can dynamically calculate the percentage of proposed development parcels sitting in 'High' flood risk zones.
- **Dynamic Updates**: If new buildings are ingested, the density automatically updates, and the FSI can be rapidly recalculated.
