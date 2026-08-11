-- =========================================================================
-- GeoNarrative Flood Susceptibility MCDA Model
-- =========================================================================

-- 1. Extract Continuous Raster Values to the Analytical Hexagon Grid
ALTER TABLE analytics_hex_features ADD COLUMN IF NOT EXISTS elevation float;
ALTER TABLE analytics_hex_features ADD COLUMN IF NOT EXISTS slope float;
ALTER TABLE analytics_hex_features ADD COLUMN IF NOT EXISTS lulc_class int;

-- Evaluate rasters exactly at the hexagon centroid for extreme performance
-- Using heavily optimized spatial joins instead of correlated subqueries to prevent hanging
UPDATE analytics_hex_features h
SET elevation = ST_Value(r.rast, ST_Centroid(h.geometry))
FROM dem_raster r
WHERE ST_Intersects(r.rast, ST_Centroid(h.geometry));

UPDATE analytics_hex_features h
SET slope = ST_Value(s.rast, ST_Centroid(h.geometry))
FROM dem_slope s
WHERE ST_Intersects(s.rast, ST_Centroid(h.geometry));

UPDATE analytics_hex_features h
SET lulc_class = ST_Value(l.rast, ST_Centroid(h.geometry))
FROM lulc_raster l
WHERE ST_Intersects(l.rast, ST_Centroid(h.geometry));

-- Impute NULL boundaries with safe zero values
UPDATE analytics_hex_features SET elevation = 0 WHERE elevation IS NULL;
UPDATE analytics_hex_features SET slope = 0 WHERE slope IS NULL;
UPDATE analytics_hex_features SET lulc_class = 0 WHERE lulc_class IS NULL;


-- 2. Build the Re-Calibrated MCDA Flood Model
DROP TABLE IF EXISTS flood_susceptibility CASCADE;

CREATE TABLE flood_susceptibility AS
WITH ranked_stats AS (
    SELECT 
        grid_id,
        geometry,
        elevation,
        slope,
        distance_to_waterways,
        building_density,
        lulc_class,
        -- Elevation Risk: Lowest 20% gets 5 (Highest Risk)
        NTILE(5) OVER (ORDER BY elevation ASC) as elev_percentile,
        -- Building Density Risk: Highest 20% gets 5 (Highest Risk)
        NTILE(5) OVER (ORDER BY building_density ASC) as dens_percentile
    FROM analytics_hex_features
),
scored AS (
    SELECT 
        grid_id,
        geometry,
        
        -- Elevation: 5 (Lowest elevation/Highest Risk) to 1 (Highest elevation/Lowest Risk)
        -- Since NTILE ASC gives 1 to the lowest values, we invert it:
        (6 - elev_percentile) AS s_elev,
        
        -- Slope based on Hydrologic Literature (Rahmati et al., 2016)
        CASE 
            WHEN slope < 2 THEN 5
            WHEN slope >= 2 AND slope < 5 THEN 4
            WHEN slope >= 5 AND slope < 10 THEN 3
            WHEN slope >= 10 AND slope < 15 THEN 2
            ELSE 1
        END AS s_slope,
        
        -- Distance to Waterways based on standard Floodplain buffers
        CASE 
            WHEN distance_to_waterways < 100 THEN 5
            WHEN distance_to_waterways >= 100 AND distance_to_waterways < 500 THEN 4
            WHEN distance_to_waterways >= 500 AND distance_to_waterways < 1000 THEN 3
            WHEN distance_to_waterways >= 1000 AND distance_to_waterways < 2000 THEN 2
            ELSE 1
        END AS s_dist,
        
        -- Building Density: NTILE ASC -> 5 is highest density. 
        dens_percentile AS s_dens,
        
        -- LULC Risk Assignment (Imperviousness / Runoff potential)
        CASE 
            WHEN lulc_class IN (50, 80) THEN 5  -- Built-up / Water
            WHEN lulc_class = 60 THEN 4         -- Bare Soil
            WHEN lulc_class = 40 THEN 3         -- Cropland
            WHEN lulc_class IN (20, 30) THEN 2  -- Grass/Shrubland
            WHEN lulc_class = 10 THEN 1         -- Forest / Trees
            ELSE 3 
        END AS s_lulc
    FROM ranked_stats
),
fsi_calc AS (
    SELECT 
        grid_id,
        geometry,
        -- Apply Saaty's AHP Weights to the 1-5 scale
        (0.35 * s_elev) + (0.25 * s_dist) + (0.20 * s_slope) + (0.10 * s_lulc) + (0.10 * s_dens) AS fsi_score
    FROM scored
)
-- 3. Risk Classification Output
SELECT 
    grid_id,
    geometry,
    fsi_score,
    -- Equal Interval Classification on a 1.0 to 5.0 scale
    CASE 
        WHEN fsi_score < 1.8 THEN 'Very Low'
        WHEN fsi_score >= 1.8 AND fsi_score < 2.6 THEN 'Low'
        WHEN fsi_score >= 2.6 AND fsi_score < 3.4 THEN 'Moderate'
        WHEN fsi_score >= 3.4 AND fsi_score < 4.2 THEN 'High'
        ELSE 'Very High'
    END AS risk_class
FROM fsi_calc;

-- 4. Operationalize the Table
CREATE INDEX idx_flood_susceptibility_geom ON flood_susceptibility USING GiST(geometry);
CREATE INDEX idx_flood_susceptibility_class ON flood_susceptibility(risk_class);

INSERT INTO geospatial_metadata (layer_name, layer_type, crs_srid, description)
VALUES ('flood_susceptibility', 'analytical_model', 4326, 'MCDA Urban Flood Susceptibility Index (FSI) Model.')
ON CONFLICT (layer_name) DO UPDATE SET last_updated = CURRENT_TIMESTAMP;
