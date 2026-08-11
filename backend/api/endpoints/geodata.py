from fastapi import APIRouter, Depends, HTTPException, Query
import asyncpg
from db.database import get_db_pool
import json

router = APIRouter()

async def execute_geojson_query(pool: asyncpg.Pool, sql: str, *args):
    """Executes a SQL query that returns a JSON string and parses it."""
    try:
        async with pool.acquire() as conn:
            result = await conn.fetchval(sql, *args)
            if result:
                return json.loads(result)
            return {"type": "FeatureCollection", "features": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/flood-risk")
async def get_flood_risk(
    limit: int = Query(2000, description="Max hexagons to return"),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    sql = """
    SELECT json_build_object(
        'type', 'FeatureCollection',
        'features', COALESCE(json_agg(
            json_build_object(
                'type', 'Feature',
                'geometry', ST_AsGeoJSON(geometry)::json,
                'properties', to_jsonb(t.*) - 'geometry'
            )
        ), '[]'::json)
    )
    FROM (
        SELECT * 
        FROM flood_risk 
        LIMIT $1
    ) t;
    """
    return await execute_geojson_query(pool, sql, limit)

@router.get("/buildings")
async def get_buildings(
    limit: int = Query(2000, description="Max buildings to return"),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    sql = """
    SELECT json_build_object(
        'type', 'FeatureCollection',
        'features', COALESCE(json_agg(
            json_build_object(
                'type', 'Feature',
                'geometry', ST_AsGeoJSON(geometry)::json,
                'properties', to_jsonb(t.*) - 'geometry'
            )
        ), '[]'::json)
    )
    FROM (
        SELECT * 
        FROM buildings 
        LIMIT $1
    ) t;
    """
    return await execute_geojson_query(pool, sql, limit)

@router.get("/pois")
async def get_pois(
    limit: int = Query(2000, description="Max POIs to return"),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    sql = """
    SELECT json_build_object(
        'type', 'FeatureCollection',
        'features', COALESCE(json_agg(
            json_build_object(
                'type', 'Feature',
                'geometry', ST_AsGeoJSON(geometry)::json,
                'properties', to_jsonb(t.*) - 'geometry'
            )
        ), '[]'::json)
    )
    FROM (
        SELECT * 
        FROM pois 
        LIMIT $1
    ) t;
    """
    return await execute_geojson_query(pool, sql, limit)

@router.get("/roads")
async def get_roads(
    limit: int = Query(5000, description="Max roads to return"),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    sql = """
    SELECT json_build_object(
        'type', 'FeatureCollection',
        'features', COALESCE(json_agg(
            json_build_object(
                'type', 'Feature',
                'geometry', ST_AsGeoJSON(geometry)::json,
                'properties', to_jsonb(t.*) - 'geometry'
            )
        ), '[]'::json)
    )
    FROM (
        SELECT * 
        FROM roads 
        LIMIT $1
    ) t;
    """
    return await execute_geojson_query(pool, sql, limit)

@router.get("/waterways")
async def get_waterways(
    limit: int = Query(5000, description="Max waterways to return"),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    sql = """
    SELECT json_build_object(
        'type', 'FeatureCollection',
        'features', COALESCE(json_agg(
            json_build_object(
                'type', 'Feature',
                'geometry', ST_AsGeoJSON(geometry)::json,
                'properties', to_jsonb(t.*) - 'geometry'
            )
        ), '[]'::json)
    )
    FROM (
        SELECT * 
        FROM waterways 
        LIMIT $1
    ) t;
    """
    return await execute_geojson_query(pool, sql, limit)

@router.get("/railways")
async def get_railways(
    limit: int = Query(5000, description="Max railways to return"),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    sql = """
    SELECT json_build_object(
        'type', 'FeatureCollection',
        'features', COALESCE(json_agg(
            json_build_object(
                'type', 'Feature',
                'geometry', ST_AsGeoJSON(geometry)::json,
                'properties', to_jsonb(t.*) - 'geometry'
            )
        ), '[]'::json)
    )
    FROM (
        SELECT * 
        FROM railways 
        LIMIT $1
    ) t;
    """
    return await execute_geojson_query(pool, sql, limit)
