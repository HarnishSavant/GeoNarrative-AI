# Spatial Analytics & Validation Pipeline

This module is strictly dedicated to data engineering, validation, and advanced spatial analytics inside PostGIS. No APIs or Frontend components are involved here.

## Contents
1. **`spatial_analytics.sql`**: The heavy-lifting PostGIS script. It uses `ST_Slope`, `ST_Aspect`, and `ST_HillShade` to derive terrain models from the DEM. It also generates `analytics_hex_features`, a 500-meter hexagonal grid containing calculated spatial densities (building, road, poi) and distances (KNN-based distance to nearest roads, waterways, railways).
2. **`run_analytics.py`**: The orchestration script. It executes the SQL, runs validation queries against all raw and derived layers (checking geometries, extents, SRIDs, and stats), populates a `geospatial_metadata` tracking table, and automatically generates a `validation_report.md`.

## Execution
Run the pipeline from your terminal:

```cmd
python analytics_pipeline\run_analytics.py
```

After it completes, check `analytics_pipeline\validation_report.md` for the comprehensive data quality results!
