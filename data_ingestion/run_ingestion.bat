@echo off
setlocal
echo ===================================================
echo GeoNarrative PostGIS Automated Ingestion Pipeline
echo ===================================================

echo [1/3] Installing required Python packages...
pip install geopandas sqlalchemy geoalchemy2 psycopg2 fiona

echo.
echo [2/3] Running Python ingestion script...
python ingest_data.py

echo.
echo [3/3] Running Validation queries...
echo Please enter the database password ('root') if prompted.
psql -h localhost -p 5432 -U postgres -d geonarrative -f validate_data.sql

echo.
echo Pipeline Complete!
pause
