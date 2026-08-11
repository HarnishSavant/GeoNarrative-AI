# Urban Flood Exposure Assessment
**Digital Twin Risk and Vulnerability Integration Methodology**

## 1. Introduction and Objectives
A Flood Susceptibility Model determines *where* a hazard is likely to occur. However, a hazard only becomes a disaster when it intersects with human systems. The objective of this Flood Exposure Assessment module is to advance the Pune Digital Twin from pure **Hazard Modeling** to **Disaster Risk Analytics**. By mathematically intersecting the Flood Susceptibility Index (FSI) with highly detailed anthropogenic infrastructure (buildings, roads, points of interest), the Digital Twin calculates tangible socio-economic exposure.

## 2. Spatial Intersection Methodology
The exposure assessment is performed natively in PostGIS to ensure maximum performance and topological accuracy:

1. **Building Exposure (`ST_Within(ST_Centroid)`):**
   - Buildings are represented as complex polygons. To prevent double-counting buildings that intersect the boundary of two hexagonal hazard zones, the model extracts the mathematical centroid of each building and determines which singular hazard zone it falls strictly within. This ensures a 1-to-1 cardinality in exposure accounting.

2. **Road Infrastructure Exposure (`ST_Intersection`):**
   - Unlike buildings, road networks traverse extensive distances across multiple risk zones. Using centroids for roads is mathematically invalid. 
   - The Digital Twin utilizes an explicit geometric intersection (`ST_Intersection`). It dynamically chops road geometries precisely at the boundaries of the hazard hexagons, isolating continuous lines into distinct risk segments. 
   - The `ST_Length(geometry::geography)` function is then applied to calculate exact meters of exposed roadway in each risk category.

3. **Critical POI Exposure (`poi_exposure`):**
   - Points of Interest (Schools, Hospitals, Transport Hubs) are spatially joined to the risk grid. This enables immediate identification of critical emergency infrastructure that may be incapacitated during severe hydrometeorological events.

## 3. Infrastructure Risk Ranking
This module provides the foundation for an **Infrastructure Risk Ranking**. By filtering the `poi_exposure` table, urban planners can rank physical assets based on their FSI score. For instance, a hospital located in a 'Very High' risk zone (FSI > 4.2) is assigned top priority for municipal resilience funding (e.g., retrofitting drainage or elevating critical generators).

## 4. How Exposure Assessment Improves the Digital Twin
Without exposure analytics, the Digital Twin is merely a topological viewer. By generating explicit `building_exposure` and `road_exposure` tables, the system achieves **Semantic Risk Intelligence**:
1. **Dynamic Dashboards**: Frontend applications can immediately query `SELECT SUM(exposed_length_m) FROM road_exposure WHERE risk_class = 'Very High'` to generate live municipal damage estimates.
2. **GeoAI Reasoning**: The LLM agent can autonomously query the specific names and types of affected POIs to generate automated Disaster Response Strategies.
3. **Suitability Models**: When evaluating parcels for new urban development, the system evaluates the pre-computed exposure of adjacent infrastructure to reject non-resilient zoning proposals.
