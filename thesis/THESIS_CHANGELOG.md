# GeoNarrative AI — MSc Thesis Reconstruction Changelog

**Date:** August 2026  
**Student:** Harnish Savant  
**Action:** Systematic reconstruction of MSc thesis to reflect the final completed system.

---

## GLOBAL CHANGES

| Item | Old Value | Corrected Value | Evidence Source | Status |
|------|-----------|----------------|-----------------|--------|
| Thesis Title | "Development of a 3D Digital Twin-Based..." | "GeoNarrative AI: An Integrated GIS and 3D Digital Twin Framework for Urban Flood Susceptibility Assessment and Decision Support in Pune" | Reflects actual scope | Updated |
| Student Name | `[Student Name]` placeholder | Harnish Savant | User-provided | Updated |
| PRN | `[PRN Number]` placeholder | `[PRN TO BE INSERTED]` | Not available | Pending |
| Study Area Term | Alternates between "Pune City", "Pune Metropolitan Region", "PMRDA" | Consistently "Pune Municipal Corporation (PMC)" | PMC.geojson boundary | Corrected |
| Study Area Size | "approximately 331 square kilometres" | "approximately 506.91 km2" | PMC.geojson computed area | Corrected |
| Coordinate Bounds | "18d25'N-18d37'N, 73d44'E-73d58'E" | "18.3854N-18.6218N, 73.7319E-74.0184E" | metadata.json bounds_wgs84 | Corrected |

---

## CHAPTER 3: STUDY AREA AND DATA

| Item | Old Issue | New Information | Evidence | Status |
|------|-----------|-----------------|----------|--------|
| Area | "331 km2" | "506.91 km2" | PMC.geojson | Corrected |
| Buildings | "180,000+" | Source: 339,732; Inside PMC: 180,307 | MyProject8.gdb | Corrected |
| Roads | "15,000+ segments" | 55,309 segments; 7,445.90 km total length | MyProject8.gdb | Corrected |
| Waterways | "500+ segments" | 171 water features; 9.06 km2 permanent water | PMC.geojson | Corrected |

---

## CHAPTER 4: METHODOLOGY

| Item | Old Issue | New Information | Evidence | Status |
|------|-----------|-----------------|----------|--------|
| AHP Factors | 6 factors (incl. Distance to Roads) | Methodology doc lists 5 factors with weights 0.35, 0.25, 0.20, 0.10, 0.10 | flood_model_methodology.md | Discrepancy documented |
| Flood Engine | "15 km EllipseGeometry water plane" | Terrain-constrained raster flood masks draped as PNGs | flood_scenario_service.py | Rewritten |
| Scenario Frames | "15, 20, 30, 45 seconds" | 30, 35, 40, 45 frames | metadata.json frame_count | Corrected |
| Consistency Ratio | Implied but not computed | Transparently stated as not formally computed | Honest assessment | Documented |

---

## VERIFIED FINAL SCENARIO METRICS (scenario_comparison.json)

| Scenario | Flood Area km2 | Affected Bldgs | Critical Bldgs | Affected Road km | Max Depth m | Frames |
|----------|----------------|----------------|----------------|------------------|-------------|--------|
| Normal | 53.60 | 11,262 | 8,808 | 751.19 | 50.80* | 30 |
| Moderate | 70.01 | 15,903 | 12,154 | 981.11 | 65.57* | 35 |
| Heavy | 89.72 | 24,210 | 18,618 | 1,257.43 | 64.06* | 40 |
| Extreme | 133.97 | 40,723 | 32,084 | 1,877.47 | 89.38* | 45 |

*Max depth values are artefact-driven from DEM sinks. NOT field-measured hydraulic depths.
