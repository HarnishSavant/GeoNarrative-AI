# UNDRR-Aligned Flood Risk Assessment Framework
**The Capstone Digital Twin Analytics Layer**

## 1. Introduction and Novelty Statement
The core contribution of this research for MSc dissertation and journal publication lies in operationalizing the internationally recognized UNDRR (United Nations Office for Disaster Risk Reduction) framework natively within a high-performance spatial database. 

Traditional urban models often conflate *Hazard* (where floods happen) with *Risk* (the actual danger to society). This framework explicitly decouples the equation into a tripartite geometric model:

```math
Risk = Hazard \times Exposure \times Vulnerability
```

**The Novelty:** By computing this mathematically rigorous framework entirely within PostGIS across 47,310 hexagonal geometries, we establish a **Living Digital Twin**. When new developments (Exposure) are added, or socio-economic demographics change (Vulnerability), the comprehensive Risk score is instantly recalculated without exporting data to external GIS software, creating a real-time Decision Support System.

## 2. Framework Variables

### A. Hazard (H)
Derived directly from the previously calibrated **Flood Susceptibility Index (FSI)**. It answers the question: *What is the probability and severity of inundation in this spatial unit?* Scale: `1.0 to 5.0`.

### B. Exposure (E)
Quantifies the sheer volume of assets physically located in the hazard zone. This is derived from the geometric sum of `building_density` and `road_density`. It answers the question: *If a flood happens here, what physical assets are standing in the water?* Scale: `0.0 to 1.0`.

### C. Vulnerability (V)
Vulnerability measures the inherent susceptibility of the exposed elements to suffer damage. A flooded park has high exposure but low vulnerability; a flooded hospital has high exposure and catastrophic vulnerability. We decompose this into three specific indicators, scaled `0 to 100`:

1. **Building Vulnerability (50% Weight)**: 
   - *Building Density*: High density limits water escape routes.
   - *Proximity to Waterways*: Buildings closer to the channel experience higher hydrodynamic forces (velocity), increasing structural collapse risk.
   - *LULC Type*: Built-up areas have no infiltration capacity.
2. **Infrastructure Vulnerability (30% Weight)**:
   - *Road Density*: Measures network criticality.
   - *Transport POIs*: Concentration of critical transit nodes whose failure cascades across the urban economy.
3. **Environmental Vulnerability (20% Weight)**:
   - *Natural / Protected Areas*: The potential loss of critical ecosystem services and biodiversity due to catastrophic erosion or contaminant flooding.

## 3. Mathematical Integration
The three matrices are combined into `raw_risk_score = Hazard * Exposure * (Vulnerability / 100)`. Because raw scores in multiplicative risk matrices often cluster, the framework applies a statistical quantile classifier (`NTILE(5)`) to dynamically partition the final risk into five deterministic classes: **Very Low, Low, Moderate, High, and Very High**.

## 4. Digital Twin Synergy
The generation of the `flood_risk` and `vulnerability_index` tables finalizes the core analytics engine of the GeoNarrative AI Digital Twin. 
- **Predictive Scenario Planning**: Planners can simulate "What if we build 500 new homes here?" The system will instantly register an increase in *Exposure*, multiplying against the baseline *Hazard*, yielding a projected future *Risk* score.
- **GeoAI Integration**: The Gemini LLM can now ingest these distinct conceptual layers. A user can ask, "Why is Region X at high risk?" and the AI can differentiate: "Region X has low Hazard, but extremely high Vulnerability due to hospital density."
