-- =========================================================================
-- GeoNarrative Spatial Foundation & Analytics Pipeline
-- =========================================================================

-- 1. CRS Correction & Metadata Fixes
-- Bypassing legacy UpdateGeometrySRID. Using modern ALTER TABLE to forcefully
-- rewrite the geometry types and dynamically assign SRID 4326 to every row.
ALTER TABLE buildings ALTER COLUMN geometry TYPE geometry(Geometry, 4326) USING ST_SetSRID(geometry, 4326);
ALTER TABLE roads ALTER COLUMN geometry TYPE geometry(Geometry, 4326) USING ST_SetSRID(geometry, 4326);
ALTER TABLE railways ALTER COLUMN geometry TYPE geometry(Geometry, 4326) USING ST_SetSRID(geometry, 4326);
ALTER TABLE waterways ALTER COLUMN geometry TYPE geometry(Geometry, 4326) USING ST_SetSRID(geometry, 4326);
ALTER TABLE transport ALTER COLUMN geometry TYPE geometry(Geometry, 4326) USING ST_SetSRID(geometry, 4326);
ALTER TABLE places ALTER COLUMN geometry TYPE geometry(Geometry, 4326) USING ST_SetSRID(geometry, 4326);
ALTER TABLE pois ALTER COLUMN geometry TYPE geometry(Geometry, 4326) USING ST_SetSRID(geometry, 4326);
ALTER TABLE landuse ALTER COLUMN geometry TYPE geometry(Geometry, 4326) USING ST_SetSRID(geometry, 4326);
ALTER TABLE "natural" ALTER COLUMN geometry TYPE geometry(Geometry, 4326) USING ST_SetSRID(geometry, 4326);
ALTER TABLE protected ALTER COLUMN geometry TYPE geometry(Geometry, 4326) USING ST_SetSRID(geometry, 4326);

-- 2. Index Rebuilding
-- Ensure spatial indexes reflect the new 4326 CRS and are fully optimized.
REINDEX TABLE buildings;
REINDEX TABLE roads;
REINDEX TABLE railways;
REINDEX TABLE waterways;
REINDEX TABLE transport;
REINDEX TABLE places;
REINDEX TABLE pois;
REINDEX TABLE landuse;
REINDEX TABLE "natural";
REINDEX TABLE protected;


-- 3. Geospatial Metadata Schema
CREATE TABLE IF NOT EXISTS geospatial_metadata (
    layer_name VARCHAR(100) PRIMARY KEY,
    layer_type VARCHAR(50),
    crs_srid INTEGER,
    feature_count INTEGER,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);


-- 4. Raster Analytics (Terrain Derivations)
DROP TABLE IF EXISTS dem_slope, dem_aspect, dem_hillshade CASCADE;

-- 111120 is the scaling factor for lat/lon to meters.
CREATE TABLE dem_slope AS
SELECT rid, ST_Slope(rast, 1, '32BF'::text, 'DEGREES'::text, 111120.0::float8) AS rast FROM dem_raster;

CREATE TABLE dem_aspect AS
SELECT rid, ST_Aspect(rast, 1, '32BF'::text) AS rast FROM dem_raster;

CREATE TABLE dem_hillshade AS
SELECT rid, ST_HillShade(rast, 1, '32BF'::text, 315.0::float8, 45.0::float8, 255.0::float8, 111120.0::float8) AS rast FROM dem_raster;

-- Constraints and Indexing
SELECT AddRasterConstraints('dem_slope'::name, 'rast'::name);
SELECT AddRasterConstraints('dem_aspect'::name, 'rast'::name);
SELECT AddRasterConstraints('dem_hillshade'::name, 'rast'::name);

CREATE INDEX idx_dem_slope_rast ON dem_slope USING GiST (ST_ConvexHull(rast));
CREATE INDEX idx_dem_aspect_rast ON dem_aspect USING GiST (ST_ConvexHull(rast));
CREATE INDEX idx_dem_hillshade_rast ON dem_hillshade USING GiST (ST_ConvexHull(rast));


-- 5. Hexagonal Analytical Grid
DROP TABLE IF EXISTS analytics_hex_grid CASCADE;

CREATE TABLE analytics_hex_grid AS
WITH ext AS (
    -- FIX: ST_Extent returns a box2d which drops the SRID! We MUST explicitly set it 
    -- to 4326 before transforming it to 32643 (UTM 43N) to get proper meter scaling.
    SELECT ST_Transform(ST_SetSRID(ST_Extent(geometry), 4326), 32643) as geom 
    FROM buildings
),
grid AS (
    SELECT (ST_HexagonGrid(500, geom)).*
    FROM ext
)
SELECT 
    row_number() over() as grid_id, 
    ST_Transform(geom, 4326) as geometry,
    ST_Centroid(ST_Transform(geom, 4326)) as centroid
FROM grid;

CREATE INDEX idx_hex_grid_geom ON analytics_hex_grid USING GiST(geometry);
CREATE INDEX idx_hex_grid_centroid ON analytics_hex_grid USING GiST(centroid);


-- 6. Distance & Density Generation
DROP TABLE IF EXISTS analytics_hex_features CASCADE;

CREATE TABLE analytics_hex_features AS
SELECT 
    h.grid_id,
    h.geometry,
    
    -- Densities
    (SELECT count(*) FROM buildings b WHERE ST_Intersects(b.geometry, h.geometry)) AS building_density,
    (SELECT count(*) FROM roads r WHERE ST_Intersects(r.geometry, h.geometry)) AS road_density,
    (SELECT count(*) FROM pois p WHERE ST_Intersects(p.geometry, h.geometry)) AS poi_density,
    
    -- Distances (Using Geography for precise meter distances)
    COALESCE((SELECT ST_Distance(h.centroid::geography, r.geometry::geography) 
              FROM roads r ORDER BY r.geometry <-> h.centroid LIMIT 1), 0) AS distance_to_roads,
              
    COALESCE((SELECT ST_Distance(h.centroid::geography, w.geometry::geography) 
              FROM waterways w ORDER BY w.geometry <-> h.centroid LIMIT 1), 0) AS distance_to_waterways,
              
    COALESCE((SELECT ST_Distance(h.centroid::geography, rw.geometry::geography) 
              FROM railways rw ORDER BY rw.geometry <-> h.centroid LIMIT 1), 0) AS distance_to_railways

FROM analytics_hex_grid h;

CREATE INDEX idx_hex_features_geom ON analytics_hex_features USING GiST(geometry);
