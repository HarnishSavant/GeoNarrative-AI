-- =========================================================================
-- GeoNarrative Flood Exposure Assessment Module
-- =========================================================================

-- 1. Building Exposure Analysis
-- Uses ST_Centroid to prevent double-counting buildings on hex boundaries
DROP TABLE IF EXISTS building_exposure CASCADE;

CREATE TABLE building_exposure AS
SELECT 
    row_number() over() as exposure_id,
    b.geometry,
    f.risk_class,
    f.fsi_score
FROM buildings b
JOIN flood_susceptibility f ON ST_Within(ST_Centroid(b.geometry), f.geometry);

CREATE INDEX idx_building_exposure_geom ON building_exposure USING GiST(geometry);
CREATE INDEX idx_building_exposure_class ON building_exposure(risk_class);


-- 2. Road Exposure Analysis (Network Segmentation)
-- Dynamically chops long continuous roads precisely at the risk boundaries
-- and computes the literal meters of roadway inside each risk zone.
DROP TABLE IF EXISTS road_exposure CASCADE;

CREATE TABLE road_exposure AS
SELECT 
    row_number() over() as exposure_id,
    ST_Intersection(r.geometry, f.geometry) as geometry,
    f.risk_class,
    f.fsi_score,
    ST_Length(ST_Intersection(r.geometry, f.geometry)::geography) as exposed_length_m
FROM roads r
JOIN flood_susceptibility f ON ST_Intersects(r.geometry, f.geometry)
WHERE ST_GeometryType(ST_Intersection(r.geometry, f.geometry)) IN ('ST_LineString', 'ST_MultiLineString');

CREATE INDEX idx_road_exposure_geom ON road_exposure USING GiST(geometry);
CREATE INDEX idx_road_exposure_class ON road_exposure(risk_class);


-- 3. Critical Infrastructure / POI Exposure Analysis
DROP TABLE IF EXISTS poi_exposure CASCADE;

CREATE TABLE poi_exposure AS
SELECT 
    row_number() over() as exposure_id,
    f.risk_class,
    f.fsi_score,
    p.*
FROM pois p
JOIN flood_susceptibility f ON ST_Within(ST_Centroid(p.geometry), f.geometry);

CREATE INDEX idx_poi_exposure_geom ON poi_exposure USING GiST(geometry);
CREATE INDEX idx_poi_exposure_class ON poi_exposure(risk_class);


-- 4. PostGIS Metadata Synchronization
INSERT INTO geospatial_metadata (layer_name, layer_type, crs_srid, description) VALUES 
('building_exposure', 'exposure_model', 4326, 'Building flood risk exposure.'),
('road_exposure', 'exposure_model', 4326, 'Road segments strictly categorized by flood risk.'),
('poi_exposure', 'exposure_model', 4326, 'Critical infrastructure POI flood risk.')
ON CONFLICT (layer_name) DO UPDATE SET last_updated = CURRENT_TIMESTAMP;
