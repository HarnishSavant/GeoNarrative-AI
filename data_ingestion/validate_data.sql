-- 1. Row counts for all tables
SELECT 'buildings' AS table_name, COUNT(*) AS row_count FROM buildings
UNION ALL SELECT 'roads', COUNT(*) FROM roads
UNION ALL SELECT 'railways', COUNT(*) FROM railways
UNION ALL SELECT 'waterways', COUNT(*) FROM waterways
UNION ALL SELECT 'places', COUNT(*) FROM places
UNION ALL SELECT 'pois', COUNT(*) FROM pois
UNION ALL SELECT 'landuse', COUNT(*) FROM landuse
UNION ALL SELECT 'natural', COUNT(*) FROM "natural"
UNION ALL SELECT 'protected', COUNT(*) FROM protected
UNION ALL SELECT 'transport', COUNT(*) FROM transport
UNION ALL SELECT 'dem_raster', COUNT(*) FROM dem_raster
UNION ALL SELECT 'lulc_raster', COUNT(*) FROM lulc_raster
ORDER BY table_name;

-- 2. Geometry validity checks
SELECT 'buildings' AS table_name, 
       SUM(CASE WHEN ST_IsValid(geometry) THEN 1 ELSE 0 END) AS valid_geoms, 
       SUM(CASE WHEN NOT ST_IsValid(geometry) THEN 1 ELSE 0 END) AS invalid_geoms 
FROM buildings
UNION ALL 
SELECT 'roads', 
       SUM(CASE WHEN ST_IsValid(geometry) THEN 1 ELSE 0 END), 
       SUM(CASE WHEN NOT ST_IsValid(geometry) THEN 1 ELSE 0 END) 
FROM roads;

-- 3. Extent checks (bounding box for key vector layers)
SELECT 'buildings' AS table_name, ST_Extent(geometry) AS bounding_box FROM buildings
UNION ALL 
SELECT 'roads', ST_Extent(geometry) FROM roads
UNION ALL 
SELECT 'waterways', ST_Extent(geometry) FROM waterways;

-- 4. Check spatial index creation (Ensures GiST indexes are applied)
SELECT
    tablename,
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    schemaname = 'public' 
    AND (indexdef LIKE '%gist%' OR indexdef LIKE '%GIST%')
ORDER BY
    tablename,
    indexname;
