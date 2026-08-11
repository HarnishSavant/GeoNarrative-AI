-- =========================================================================
-- GeoNarrative Digital Twin Risk Layer
-- Risk = Hazard * Exposure * Vulnerability
-- =========================================================================

-- 1. Create fast materialized counts for Spatial Joins
DROP TABLE IF EXISTS hex_pois, hex_natural, hex_protected CASCADE;

CREATE TEMP TABLE hex_pois AS
SELECT h.grid_id, COUNT(p.exposure_id) as transport_pois
FROM analytics_hex_features h
JOIN poi_exposure p ON ST_Intersects(h.geometry, p.geometry)
GROUP BY h.grid_id;

CREATE TEMP TABLE hex_natural AS
SELECT h.grid_id, COUNT(*) as natural_areas
FROM analytics_hex_features h
JOIN "natural" n ON ST_Intersects(h.geometry, n.geometry)
GROUP BY h.grid_id;

CREATE TEMP TABLE hex_protected AS
SELECT h.grid_id, COUNT(*) as protected_areas
FROM analytics_hex_features h
JOIN protected pr ON ST_Intersects(h.geometry, pr.geometry)
GROUP BY h.grid_id;

-- 2. Vulnerability Index Calculation (0-100 Scale)
DROP TABLE IF EXISTS vulnerability_index CASCADE;

CREATE TABLE vulnerability_index AS
WITH hex_vuln AS (
    SELECT 
        h.grid_id,
        h.geometry,
        h.building_density,
        h.lulc_class,
        h.distance_to_waterways,
        h.road_density,
        COALESCE(p.transport_pois, 0) as transport_pois,
        COALESCE(n.natural_areas, 0) as natural_areas,
        COALESCE(pr.protected_areas, 0) as protected_areas
    FROM analytics_hex_features h
    LEFT JOIN hex_pois p ON h.grid_id = p.grid_id
    LEFT JOIN hex_natural n ON h.grid_id = n.grid_id
    LEFT JOIN hex_protected pr ON h.grid_id = pr.grid_id
),
scored_vuln AS (
    SELECT
        grid_id,
        geometry,
        -- Building Vulnerability (0-100)
        LEAST(
            ((building_density / 1000.0) * 50) + 
            (CASE WHEN distance_to_waterways < 500 THEN 30 ELSE 0 END) +
            (CASE WHEN lulc_class IN (50, 80) THEN 20 ELSE 0 END)
        , 100.0) AS bldg_v,
        
        -- Infrastructure Vulnerability (0-100)
        LEAST(((road_density / 500.0) * 60) + (transport_pois * 20), 100.0) AS infra_v,
        
        -- Environmental Vulnerability (0-100)
        LEAST((protected_areas * 50) + (natural_areas * 10), 100.0) AS env_v
    FROM hex_vuln
)
SELECT 
    grid_id,
    geometry,
    bldg_v,
    infra_v,
    env_v,
    -- Composite Vulnerability (0-100)
    (0.50 * bldg_v) + (0.30 * infra_v) + (0.20 * env_v) AS vulnerability_score
FROM scored_vuln;

CREATE INDEX idx_vulnerability_geom ON vulnerability_index USING GiST(geometry);

-- 3. Composite Flood Risk Model
DROP TABLE IF EXISTS flood_risk CASCADE;

CREATE TABLE flood_risk AS
WITH risk_factors AS (
    SELECT 
        f.grid_id,
        f.geometry,
        f.fsi_score AS hazard,
        v.vulnerability_score / 100.0 AS vulnerability,
        LEAST(((a.building_density / 1000.0) + (a.road_density / 500.0)) / 2.0, 1.0) AS exposure
    FROM flood_susceptibility f
    JOIN vulnerability_index v ON f.grid_id = v.grid_id
    JOIN analytics_hex_features a ON f.grid_id = a.grid_id
),
risk_calc AS (
    SELECT 
        grid_id,
        geometry,
        hazard,
        exposure,
        vulnerability,
        (hazard * exposure * vulnerability) AS raw_risk_score
    FROM risk_factors
)
SELECT 
    grid_id,
    geometry,
    hazard,
    exposure,
    vulnerability,
    raw_risk_score,
    -- Apply NTILE(5) for a guaranteed 20% quintile distribution for exact statistical balancing
    NTILE(5) OVER (ORDER BY raw_risk_score ASC) as risk_class_ntile
FROM risk_calc;

-- Apply textual classifications
ALTER TABLE flood_risk ADD COLUMN risk_class VARCHAR(20);
UPDATE flood_risk SET risk_class = CASE 
    WHEN risk_class_ntile = 1 THEN 'Very Low'
    WHEN risk_class_ntile = 2 THEN 'Low'
    WHEN risk_class_ntile = 3 THEN 'Moderate'
    WHEN risk_class_ntile = 4 THEN 'High'
    WHEN risk_class_ntile = 5 THEN 'Very High'
END;

CREATE INDEX idx_flood_risk_geom ON flood_risk USING GiST(geometry);
CREATE INDEX idx_flood_risk_class ON flood_risk(risk_class);

-- 4. Metadata Sync
INSERT INTO geospatial_metadata (layer_name, layer_type, crs_srid, description) VALUES 
('vulnerability_index', 'risk_model', 4326, 'Socio-environmental vulnerability scores (0-100).'),
('flood_risk', 'risk_model', 4326, 'Final UNDRR composite Risk = Hazard * Exposure * Vulnerability.')
ON CONFLICT (layer_name) DO UPDATE SET last_updated = CURRENT_TIMESTAMP;
