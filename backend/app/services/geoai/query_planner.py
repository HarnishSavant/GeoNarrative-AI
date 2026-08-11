import logging
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.services.spatial_query_service import SpatialQueryService

logger = logging.getLogger("geonarrative.geoai.query_planner")

class QueryPlanner:
    """
    GeoAI Query Planner
    Translates structured intents into safe, parameterized PostGIS queries.
    Prevents SQL injection by strictly using predefined templates instead of LLM-generated SQL.
    """

    @staticmethod
    async def execute_plan(intent_payload: Dict[str, Any], db: AsyncSession) -> Dict[str, Any]:
        """Route intent to the appropriate query execution template."""
        intent = intent_payload.get("intent")
        entities = intent_payload.get("entities", {})
        
        logger.info(f"Planning query for Intent: {intent}")
        
        try:
            if intent == "RiskIntent":
                return await QueryPlanner._execute_risk_query(db, entities)
            elif intent == "ExposureIntent":
                return await QueryPlanner._execute_exposure_query(db, entities)
            elif intent == "InfrastructureIntent":
                return await QueryPlanner._execute_infrastructure_query(db, entities)
            elif intent == "ShelterIntent":
                return await QueryPlanner._execute_shelter_query(db, entities)
            elif intent == "SpatialSearchIntent":
                return await QueryPlanner._execute_spatial_search(db, entities)
            elif intent == "AnalyticsIntent":
                return await QueryPlanner._execute_analytics_query(db, entities)
            else:
                return {"status": "unsupported", "message": "No spatial query mapped for this intent."}
        except Exception as e:
            logger.error(f"Query Planner Error: {str(e)}")
            return {"status": "error", "message": str(e)}

    @staticmethod
    async def _execute_risk_query(db: AsyncSession, entities: Dict[str, Any]) -> Dict[str, Any]:
        """Maps to Risk Analytics API logic (Dynamic)."""
        query = text("""
            SELECT 'Critical Infrastructure Near Water' as metric, COUNT(*) as value
            FROM pois p
            JOIN waterways w ON ST_DWithin(p.geometry::geography, w.geometry::geography, 200)
            WHERE p.fclass IN ('hospital', 'school', 'clinic')
        """)
        result = await db.execute(query)
        rows = result.all()
        return {"query_type": "RiskSummary", "data": [dict(row._mapping) for row in rows]}

    @staticmethod
    async def _execute_exposure_query(db: AsyncSession, entities: Dict[str, Any]) -> Dict[str, Any]:
        """Maps to Exposure Analytics logic."""
        query = text("""
            SELECT 'Buildings in 500m of Water' as asset_type, COUNT(*) as exposed_count 
            FROM buildings b
            JOIN waterways w ON ST_DWithin(b.geometry::geography, w.geometry::geography, 500)
            UNION ALL
            SELECT 'Roads (m) near water' as asset_type, ROUND(SUM(ST_Length(ST_Intersection(r.geometry, ST_Buffer(w.geometry::geography, 500)::geometry)::geography))::numeric, 2) as exposed_count 
            FROM roads r
            JOIN waterways w ON ST_DWithin(r.geometry::geography, w.geometry::geography, 500)
        """)
        try:
            result = await db.execute(query)
            rows = result.all()
            return {"query_type": "ExposureSummary", "data": [dict(row._mapping) for row in rows]}
        except Exception:
            return {"query_type": "ExposureSummary", "data": []}

    @staticmethod
    async def _execute_infrastructure_query(db: AsyncSession, entities: Dict[str, Any]) -> Dict[str, Any]:
        """Maps to Critical Infrastructure logic."""
        feature_types = entities.get("feature_types", [])
        
        query = text("""
            SELECT p.name, p.fclass as type, 'High' as risk_class, 
                   ROUND(ST_Distance(p.geometry::geography, w.geometry::geography)::numeric, 1) as dist_to_water_m
            FROM pois p
            JOIN waterways w ON ST_DWithin(p.geometry::geography, w.geometry::geography, 200)
            WHERE p.fclass IN ('hospital', 'clinic', 'school', 'fire_station', 'police')
            ORDER BY dist_to_water_m ASC
            LIMIT 50
        """)
        try:
            result = await db.execute(query)
            rows = result.all()
            data = [dict(row._mapping) for row in rows]
            if feature_types:
                data = [d for d in data if any(t.lower() in str(d["type"]).lower() for t in feature_types)]
            return {"query_type": "CriticalInfrastructure", "filtered_by": feature_types, "data": data}
        except Exception:
            return {"query_type": "CriticalInfrastructure", "filtered_by": feature_types, "data": []}

    @staticmethod
    async def _execute_shelter_query(db: AsyncSession, entities: Dict[str, Any]) -> Dict[str, Any]:
        """Maps to Emergency Shelter planning logic."""
        query = text("""
            SELECT p.name, p.fclass as type, 'Low' as risk_class
            FROM pois p
            WHERE p.fclass IN ('school', 'college', 'stadium', 'community_centre', 'public_building')
              AND NOT EXISTS (
                  SELECT 1 FROM waterways w WHERE ST_DWithin(p.geometry::geography, w.geometry::geography, 500)
              )
            LIMIT 20
        """)
        try:
            result = await db.execute(query)
            rows = result.all()
            return {"query_type": "ShelterRecommendations", "data": [dict(row._mapping) for row in rows]}
        except Exception:
            return {"query_type": "ShelterRecommendations", "data": []}

    @staticmethod
    async def _execute_spatial_search(db: AsyncSession, entities: Dict[str, Any]) -> Dict[str, Any]:
        """Executes hybrid dynamic spatial search using safe parameterized ST_DWithin templates."""
        distance = entities.get("distance_m", 500)
        if not isinstance(distance, (int, float)): distance = 500
        
        # Safe parameterized spatial join template optimized for EPSG:4326
        # Uses planar ST_DWithin for fast bounding-box index filtering (~0.00001 degrees per meter)
        # Then applies exact geography ST_DWithin on the significantly reduced subset.
        query = text("""
            SELECT p.name as poi_name, p.fclass as poi_type, r.name as waterway_name,
                   ROUND(ST_Distance(p.geometry::geography, r.geometry::geography)) as distance_m
            FROM pois p
            JOIN waterways r ON ST_DWithin(p.geometry, r.geometry, :dist * 0.00001)
            WHERE p.fclass IN ('hospital', 'clinic', 'school')
              AND ST_DWithin(p.geometry::geography, r.geometry::geography, :dist)
            LIMIT 15
        """)
        result = await db.execute(query, {"dist": distance})
        rows = result.all()
        return {"query_type": "SpatialSearch", "distance_threshold": distance, "data": [dict(row._mapping) for row in rows]}

    @staticmethod
    async def _execute_analytics_query(db: AsyncSession, entities: Dict[str, Any]) -> Dict[str, Any]:
        """Executes broad aggregations."""
        query = text("""
            SELECT risk_class, ROUND(SUM(exposed_length_m)::numeric, 2) as total_road_km
            FROM road_exposure
            GROUP BY risk_class
        """)
        result = await db.execute(query)
        rows = result.all()
        return {"query_type": "AdvancedAnalytics", "data": [dict(row._mapping) for row in rows]}
