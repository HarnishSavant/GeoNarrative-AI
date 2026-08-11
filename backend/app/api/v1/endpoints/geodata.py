from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.database import get_db
import json
import logging

router = APIRouter()
logger = logging.getLogger("geonarrative_telemetry")

async def fetch_geojson_layer(db: AsyncSession, table_name: str, bbox: str) -> dict:
    """Fetch GeoJSON from PostGIS filtered by bounding box."""
    try:
        # Bbox expected format: minLon,minLat,maxLon,maxLat
        parts = bbox.split(',')
        if len(parts) != 4:
            raise ValueError("Invalid bbox format. Use minLon,minLat,maxLon,maxLat")
            
        min_lon, min_lat, max_lon, max_lat = map(float, parts)
        
        # Security check to prevent SQL injection on table_name
        allowed_tables = ["buildings", "roads", "pois", "waterways", "railways", "flood_risk"]
        if table_name not in allowed_tables:
            raise HTTPException(status_code=400, detail="Invalid layer requested")
            
        # PostGIS ST_MakeEnvelope uses (xmin, ymin, xmax, ymax, SRID)
        # Using ST_Intersects for efficient spatial querying against spatial index
        query = text(f"""
            SELECT jsonb_build_object(
                'type',     'FeatureCollection',
                'features', COALESCE(jsonb_agg(feature), '[]'::jsonb)
            ) AS geojson
            FROM (
                SELECT jsonb_build_object(
                    'type',       'Feature',
                    'geometry',   ST_AsGeoJSON(geometry)::jsonb,
                    'properties', to_jsonb(t) - 'geometry' - 'id'
                ) AS feature
                FROM {table_name} AS t
                WHERE ST_Intersects(
                    geometry, 
                    ST_MakeEnvelope(:min_lon, :min_lat, :max_lon, :max_lat, 4326)
                )
                LIMIT 8000
            ) features;
        """)
        
        result = await db.execute(query, {
            "min_lon": min_lon,
            "min_lat": min_lat,
            "max_lon": max_lon,
            "max_lat": max_lat
        })
        row = result.scalar()
        
        import json
        if isinstance(row, str):
            try:
                row = json.loads(row)
            except:
                pass

        return row if row else {"type": "FeatureCollection", "features": []}
    except Exception as e:
        logger.error(f"Error fetching geodata layer {table_name} for bbox {bbox}: {e}")
        # Return empty feature collection instead of failing completely
        return {"type": "FeatureCollection", "features": []}

@router.get("/buildings")
async def get_buildings(bbox: str = Query(..., description="minLon,minLat,maxLon,maxLat"), db: AsyncSession = Depends(get_db)):
    return await fetch_geojson_layer(db, "buildings", bbox)

@router.get("/roads")
async def get_roads(bbox: str = Query(..., description="minLon,minLat,maxLon,maxLat"), db: AsyncSession = Depends(get_db)):
    return await fetch_geojson_layer(db, "roads", bbox)

@router.get("/pois")
async def get_pois(bbox: str = Query(..., description="minLon,minLat,maxLon,maxLat"), db: AsyncSession = Depends(get_db)):
    return await fetch_geojson_layer(db, "pois", bbox)

@router.get("/waterways")
async def get_waterways(bbox: str = Query(..., description="minLon,minLat,maxLon,maxLat"), db: AsyncSession = Depends(get_db)):
    return await fetch_geojson_layer(db, "waterways", bbox)

@router.get("/railways")
async def get_railways(bbox: str = Query(..., description="minLon,minLat,maxLon,maxLat"), db: AsyncSession = Depends(get_db)):
    return await fetch_geojson_layer(db, "railways", bbox)

@router.get("/flood-risk")
async def get_flood_risk(bbox: str = Query(..., description="minLon,minLat,maxLon,maxLat"), db: AsyncSession = Depends(get_db)):
    return await fetch_geojson_layer(db, "flood_risk", bbox)

@router.get("/risk-grid")
async def get_risk_grid(bbox: str = Query(..., description="minLon,minLat,maxLon,maxLat"), db: AsyncSession = Depends(get_db)):
    """Dynamically generate Hexagon Fishnet Grid and compute UNDRR risk per cell using Spatial Joins."""
    try:
        parts = bbox.split(',')
        if len(parts) != 4:
            raise ValueError("Invalid bbox format. Use minLon,minLat,maxLon,maxLat")
            
        min_lon, min_lat, max_lon, max_lat = map(float, parts)
        
        # Dynamic hex size to prevent DB lockup from massive arrays
        area = (max_lon - min_lon) * (max_lat - min_lat)
        hex_size = 0.003
        if area > 0.02: hex_size = 0.006
        if area > 0.1:  hex_size = 0.012
        if area > 0.3:  hex_size = 0.025
        if area > 1.0:  hex_size = 0.05
        
        query = text("""
            WITH bounds AS (
                SELECT ST_MakeEnvelope(:min_lon, :min_lat, :max_lon, :max_lat, 4326) as geom
            ),
            grid AS (
                SELECT h.geom 
                FROM bounds, ST_HexagonGrid(:hex_size, bounds.geom) h
            )
            SELECT jsonb_build_object(
                'type',     'FeatureCollection',
                'features', COALESCE(jsonb_agg(
                    jsonb_build_object(
                        'type',       'Feature',
                        'geometry',   ST_AsGeoJSON(g.geom)::jsonb,
                        'properties', jsonb_build_object(
                            'h_score', (SELECT COUNT(*) FROM waterways w WHERE ST_Intersects(g.geom, w.geometry)),
                            'e_score', (SELECT COUNT(*) FROM buildings b WHERE ST_Intersects(g.geom, b.geometry)),
                            'v_score', (SELECT COUNT(*) FROM pois p WHERE ST_Intersects(g.geom, p.geometry) AND p.fclass IN ('hospital', 'school', 'clinic'))
                        )
                    )
                ), '[]'::jsonb)
            ) AS geojson
            FROM grid g;
        """)
        
        result = await db.execute(query, {
            "min_lon": min_lon,
            "min_lat": min_lat,
            "max_lon": max_lon,
            "max_lat": max_lat,
            "hex_size": hex_size
        })
        row = result.scalar()
        
        if isinstance(row, str):
            try:
                row = json.loads(row)
            except:
                pass

        # Post-process to calculate final risk score per cell
        if row and isinstance(row, dict) and 'features' in row:
            for feature in row['features']:
                props = feature['properties']
                h = min(props['h_score'] / 2.0, 1.0)
                e = min(props['e_score'] / 50.0, 1.0)
                v = min(props['v_score'] / 2.0, 1.0)
                if e == 0: e = 0.1
                if v == 0: v = 0.1
                
                # UNDRR: Risk = (H * E * V) / Capacity (assuming capacity=0.8)
                risk = (h * e * v) / 0.8
                score = round(min(risk * 10, 10.0), 1)
                
                props['risk_score'] = score
                props['risk_level'] = (
                    "critical" if score > 8.5 
                    else "high" if score > 6.0 
                    else "medium" if score > 3.0 
                    else "low"
                )
                
        return row if row else {"type": "FeatureCollection", "features": []}
    except Exception as e:
        logger.error(f"Error computing dynamic risk grid for bbox {bbox}: {e}")
        return {"type": "FeatureCollection", "features": []}
