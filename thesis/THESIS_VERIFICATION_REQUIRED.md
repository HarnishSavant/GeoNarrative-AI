# GeoNarrative AI — Thesis Claims Requiring Manual Verification

**Date:** August 2026

This document lists every claim or value in the reconstructed thesis that requires
manual confirmation before the thesis can be considered verified.

---

## 1. FLOOD SUSCEPTIBILITY AREA DISTRIBUTION

**Claim:** The thesis reports approximate percentage distribution across five
susceptibility classes (Very Low, Low, Moderate, High, Very High).

**Issue:** The exact area breakdown per susceptibility class was not found in
`data_processed` outputs. The existing chapter uses approximate percentages
(~18%, ~22%, ~25%, ~20%, ~15%) without specifying their source.

**Required Action:** Run the flood susceptibility raster against the PMC boundary
and compute exact pixel counts per class. Alternatively, query the PostGIS
`flood_susceptibility` table for area per class.

**Status:** [REQUIRES VERIFICATION]

---

## 2. AHP PAIRWISE COMPARISON MATRIX CONSISTENCY

**Claim:** The thesis presents an AHP pairwise comparison matrix.

**Issue:** Two versions of AHP weights exist in the project:
- `ch4_methodology.py` uses 6 factors: 0.30, 0.25, 0.20, 0.10, 0.10, 0.05
- `flood_model_methodology.md` uses 5 factors: 0.35, 0.25, 0.20, 0.10, 0.10

The actual `run_flood_model.py` script determines which was used in practice.

**Required Action:** Student to confirm which factor set and weight assignment
was used in the FINAL flood susceptibility computation. If "Distance to Roads"
was dropped, the thesis must reflect only 5 factors.

**Status:** [REQUIRES VERIFICATION]

---

## 3. CONSISTENCY RATIO (CR)

**Claim:** The thesis implies AHP consistency was assessed.

**Issue:** No computed CR value was found in any project output. The methodology
documents do not include eigenvalue computation or CR calculation.

**Required Action:** Either compute CR from the pairwise matrix and report it,
or explicitly state that CR was not formally computed and that weights were
adopted from published literature.

**Status:** [REQUIRES VERIFICATION — thesis currently states transparently
that CR was not formally computed]

---

## 4. PMC BOUNDARY AREA

**Claim:** "approximately 506.91 km2"

**Issue:** This value was provided by the user. The bounds from metadata.json
(73.7319E-74.0184E, 18.3854N-18.6218N) are confirmed in all scenario files.
However, the computed geodesic area depends on the CRS used and method of
calculation.

**Required Action:** Compute geodesic area of PMC.geojson using GeoPandas
`.to_crs(epsg=32643).area` and confirm.

**Status:** [REQUIRES VERIFICATION]

---

## 5. BUILDING COUNT INSIDE PMC

**Claim:** 180,307 buildings inside PMC from 339,732 source buildings.

**Issue:** User-provided value. The old thesis stated "180,000+". The precise
count depends on the clipping method (centroid containment vs. intersection).

**Required Action:** Confirm by running a spatial query on the actual processed
building dataset.

**Status:** [REQUIRES VERIFICATION]

---

## 6. ROAD STATISTICS

**Claim:** 55,309 segments; 7,445.90 km total length.

**Issue:** User-provided values. Old thesis stated "15,000+ segments".

**Required Action:** Confirm from processed road dataset.

**Status:** [REQUIRES VERIFICATION]

---

## 7. SCENARIO FLOOD METRICS

**Claim:** Final scenario metrics from scenario_comparison.json.

**Issue:** The metadata.json files in each scenario directory contain per-frame
statistics. The final-frame values differ from the user-provided "final" values.

For example, Normal scenario metadata.json shows frame 29 (last frame):
- flooded_area_km2: 40.56 (vs. user-stated 53.60)
- affected_buildings: 8,520 (vs. user-stated 11,262)

This discrepancy suggests either:
(a) scenario_comparison.json contains values from a different/later processing run
(b) the user-provided values represent a cumulative or aggregate measure
(c) additional processing occurred after the per-frame metadata was written

**Required Action:** Locate and verify `scenario_comparison.json`. If it exists
and contains the user-stated values, those are authoritative. Otherwise, use
the metadata.json final-frame values.

**CRITICAL DISCREPANCY — Must be resolved before thesis submission.**

**Status:** [REQUIRES VERIFICATION]

---

## 8. DEPTH VALUES

**Claim:** The thesis reports scenario-derived depth statistics.

**Issue:** Max depth values from metadata.json (39-89 m) are unrealistically
high for urban flooding and result from DEM sink artefacts or steep terrain
elevation differences within flooded cells. These are relative elevation
differences (DEM value minus flood surface), not actual water column heights.

**Required Action:** Student to confirm how depth was computed and whether any
percentile capping (e.g., 95th percentile) was applied. The thesis must clearly
state these are "scenario-derived relative inundation depth estimates" and not
field-measured hydraulic depths.

**Status:** [REQUIRES VERIFICATION]

---

## 9. LULC AREA PERCENTAGES

**Claim:** Table 6.1 reports approximate LULC class percentages.

**Issue:** Values (~12% forest, ~42% built-up, etc.) appear to be estimates
rather than computed from the actual Sentinel-2 LULC raster within the PMC
boundary.

**Required Action:** Compute pixel counts per LULC class from the clipped
LULC raster and derive actual percentages.

**Status:** [REQUIRES VERIFICATION]

---

## 10. ELEVATION RANGE

**Claim:** "540-800+ metres above mean sea level"

**Issue:** This range is stated in the old thesis without citing the actual
DEM min/max within the PMC boundary.

**Required Action:** Extract actual min/max elevation from the clipped DEM
raster.

**Status:** [REQUIRES VERIFICATION]

---

## 11. REFERENCES

**Claim:** All references in the References section are legitimate publications.

**Issue:** Each reference was retained from the original thesis. While authors,
years, and titles appear consistent with known publications, DOIs have not been
individually verified.

**Required Action:** Student to verify each reference against its actual
publication source (Google Scholar, DOI.org, publisher website).

**Status:** [REQUIRES VERIFICATION]

---

## 12. SCREENSHOTS

**Claim:** The thesis includes figure placeholders for application screenshots.

**Issue:** No actual screenshots are embedded; all are placeholders requiring
manual screen capture from the running application.

**Required Action:** Capture screenshots from the final running application
for all figure placeholders.

**Status:** [REQUIRES MANUAL CAPTURE]
