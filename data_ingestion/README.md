# GeoNarrative Data Ingestion Pipeline

This directory contains the fully automated data ingestion pipeline for the Pune Metropolitan Region Digital Twin. It reads the raw geodatabase and raster layers and loads them optimally into the PostGIS database.

## Prerequisites

1. **Python 3.8+** installed and added to your `PATH`.
2. **Docker Containers** running (specifically `geonarrative_db`). Run `docker-compose up -d db` in the root folder if it isn't running.
3. **PostgreSQL Client Tools** (Optional but recommended): Having `psql` and `raster2pgsql` in your Windows `PATH` will speed up raster processing. If they are not found locally, the script automatically falls back to copying the data into the Docker container and running the commands from inside the container.

## Folder Structure Expected
The pipeline expects the `Data` folder to be located at the root of the project (one level up from this script):
```
Data/
├── MyProject8.gdb
├── output_hh.tif
└── Pune_LULC_10m_2024.tif
```

## How to Run

1. Open a Command Prompt or PowerShell in this `data_ingestion` directory.
2. Run the batch script:
   ```cmd
   run_ingestion.bat
   ```
3. When prompted by `psql` during the validation step, enter the database password: `root`.

## What This Pipeline Does

1. **Vector Ingestion (GeoPandas + GeoAlchemy2)**
   - Connects to `MyProject8.gdb`.
   - Iterates through the specified layers (`building`, `roads`, `railways`, `water_ways`, `places`, `pois`, `landuse`, `natural`, `protected`, `transport`).
   - Normalizes geometry names and fixes any invalid geometries using `make_valid()`.
   - Imports them into PostGIS, preserving CRS and creating automated GiST spatial indexes.
   - Runs `ANALYZE` on the generated tables for optimized query planning.

2. **Raster Ingestion (raster2pgsql)**
   - Uses `raster2pgsql` to convert `output_hh.tif` (DEM) and `Pune_LULC_10m_2024.tif` (LULC) into SQL statements.
   - Applies tiling (`-t auto`), spatial indexing (`-I`), and constraints (`-C`).
   - Executes the ingestion either via local binaries or Docker fallback.

3. **Validation (SQL)**
   - Runs `validate_data.sql` to verify that all rows were imported correctly, geometries are valid, extents match expectations, and GiST indexes were properly applied.
