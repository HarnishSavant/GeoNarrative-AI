import time
import logging
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.database import get_db
from app.models.db_models import User
from app.api.v1.endpoints.auth import get_current_user
from app.services.analytics_service import spatial_analytics

router = APIRouter()
logger = logging.getLogger("geonarrative.analytics")

@router.get("/risk-summary")
async def get_risk_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns total hexagon counts grouped by Risk Class.
    Queries the 'flood_risk' table which holds the Jenks Optimized classifications.
    """
    start_time = time.time()
    
    query = text("""
        SELECT risk_class, COUNT(*) as hex_count, 
               SUM(exposure) as total_exposure, 
               SUM(vulnerability) as total_vulnerability
        FROM flood_risk
        GROUP BY risk_class
        ORDER BY 
            CASE risk_class 
                WHEN 'Very Low' THEN 1 
                WHEN 'Low' THEN 2 
                WHEN 'Moderate' THEN 3 
                WHEN 'High' THEN 4 
                WHEN 'Very High' THEN 5 
                ELSE 6 
            END;
    """)
    
    try:
        result = await db.execute(query)
        rows = result.all()
        
        data = [
            {
                "risk_class": row.risk_class,
                "hex_count": row.hex_count,
                "total_exposure": float(row.total_exposure or 0),
                "total_vulnerability": float(row.total_vulnerability or 0)
            }
            for row in rows
        ]
        
        execution_time = round((time.time() - start_time) * 1000, 2)
        logger.info(f"Executed /risk-summary in {execution_time}ms")
        
        return {
            "status": "success",
            "execution_time_ms": execution_time,
            "data": data
        }
    except Exception as e:
        logger.error(f"Error in risk-summary: {str(e)}")
        raise HTTPException(status_code=500, detail="Database query failed for risk summary.")

@router.get("/exposure-summary")
async def get_exposure_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns exact counts of Buildings, Roads, and POIs intersecting High/Very High flood zones.
    Reuses precomputed exposure tables (building_exposure, road_exposure, poi_exposure) 
    instead of expensive ST_Intersects joins.
    """
    start_time = time.time()
    
    query = text("""
        SELECT 'Buildings' as asset_type, risk_class, COUNT(*) as metric_value
        FROM building_exposure
        GROUP BY risk_class
        UNION ALL
        SELECT 'POIs' as asset_type, risk_class, COUNT(*) as metric_value
        FROM poi_exposure
        GROUP BY risk_class
        UNION ALL
        SELECT 'Roads (m)' as asset_type, risk_class, ROUND(SUM(exposed_length_m)::numeric, 2) as metric_value
        FROM road_exposure
        GROUP BY risk_class;
    """)
    
    try:
        result = await db.execute(query)
        rows = result.all()
        
        data = [
            {
                "asset_type": row.asset_type,
                "risk_class": row.risk_class,
                "metric_value": float(row.metric_value) if row.metric_value else 0
            }
            for row in rows
        ]
        
        execution_time = round((time.time() - start_time) * 1000, 2)
        logger.info(f"Executed /exposure-summary in {execution_time}ms")
        
        return {
            "status": "success",
            "execution_time_ms": execution_time,
            "data": data
        }
    except Exception as e:
        logger.error(f"Error in exposure-summary: {str(e)}")
        raise HTTPException(status_code=500, detail="Database query failed for exposure summary.")

@router.get("/critical-infrastructure")
async def get_critical_infrastructure(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Identifies specific POIs (Hospitals, Schools, Emergency Services) located inside High/Very High risk zones.
    Uses the precomputed poi_exposure table.
    """
    start_time = time.time()
    
    query = text("""
        SELECT name, fclass as type, risk_class, fsi_score,
               ST_Y(geometry) as lat, ST_X(geometry) as lng
        FROM poi_exposure
        WHERE risk_class IN ('High', 'Very High') 
          AND fclass IN ('hospital', 'clinic', 'school', 'fire_station', 'police', 'bus_station', 'railway_station')
        ORDER BY fsi_score DESC
        LIMIT 100;
    """)
    
    try:
        result = await db.execute(query)
        rows = result.all()
        
        data = [
            {
                "name": row.name or "Unknown Facility",
                "type": row.type,
                "risk_class": row.risk_class,
                "fsi_score": float(row.fsi_score or 0),
                "coordinates": {"lat": row.lat, "lng": row.lng}
            }
            for row in rows
        ]
        
        execution_time = round((time.time() - start_time) * 1000, 2)
        logger.info(f"Executed /critical-infrastructure in {execution_time}ms")
        
        return {
            "status": "success",
            "execution_time_ms": execution_time,
            "data": data
        }
    except Exception as e:
        logger.error(f"Error in critical-infrastructure: {str(e)}")
        raise HTTPException(status_code=500, detail="Database query failed for critical infrastructure.")

@router.get("/shelter-recommendations")
async def get_shelter_recommendations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Recommends civic buildings (Schools, Community Centers, Stadiums) located in 
    Very Low / Low risk zones that can be used as emergency assembly areas.
    """
    start_time = time.time()
    
    query = text("""
        SELECT name, fclass as type, risk_class,
               ST_Y(geometry) as lat, ST_X(geometry) as lng
        FROM poi_exposure
        WHERE risk_class IN ('Very Low', 'Low') 
          AND fclass IN ('school', 'college', 'university', 'community_centre', 'stadium')
          AND name IS NOT NULL
        LIMIT 50;
    """)
    
    try:
        result = await db.execute(query)
        rows = result.all()
        
        data = [
            {
                "name": row.name,
                "type": row.type,
                "risk_class": row.risk_class,
                "coordinates": {"lat": row.lat, "lng": row.lng}
            }
            for row in rows
        ]
        
        execution_time = round((time.time() - start_time) * 1000, 2)
        logger.info(f"Executed /shelter-recommendations in {execution_time}ms")
        
        return {
            "status": "success",
            "execution_time_ms": execution_time,
            "data": data
        }
    except Exception as e:
        logger.error(f"Error in shelter-recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail="Database query failed for shelter recommendations.")

# ═════════════════════════════════════════════════════════════════════════════
# RESEARCH-GRADE SPATIAL ANALYTICS ENDPOINTS (PHASE 7)
# ═════════════════════════════════════════════════════════════════════════════

@router.get("/overview")
async def get_analytics_overview():
    """Returns verified GIS study area statistics and KPIs without fabricated numbers."""
    return {"status": "success", "data": spatial_analytics.get_overview_statistics()}

@router.get("/susceptibility")
async def get_analytics_susceptibility():
    """Returns AHP criteria weights, factor analysis, and Consistency Ratio metrics."""
    return {"status": "success", "data": spatial_analytics.get_susceptibility_analytics()}

@router.get("/terrain")
async def get_analytics_terrain():
    """Returns validated DEM elevation and topographic slope statistics."""
    return {"status": "success", "data": spatial_analytics.get_terrain_analytics()}

@router.get("/lulc")
async def get_analytics_lulc():
    """Returns 10-meter resolution Pune LULC surface classification distribution."""
    return {"status": "success", "data": spatial_analytics.get_lulc_analytics()}

@router.get("/scenarios")
async def get_analytics_scenarios():
    """Returns scenario comparison summary across Normal, Moderate, Heavy, and Extreme rainfall events."""
    return {"status": "success", "data": spatial_analytics.get_scenarios_comparison()}

@router.get("/scenarios/{scenario_id}")
async def get_analytics_scenario_detail(scenario_id: str):
    """Returns detailed statistical profile for a specific flood scenario."""
    comp = spatial_analytics.get_scenarios_comparison()["scenarios"].get(scenario_id.lower().strip(), {})
    return {"status": "success", "data": comp}

@router.get("/scenarios/{scenario_id}/timeline")
async def get_analytics_scenario_timeline(scenario_id: str):
    """Returns frame-by-frame temporal flood progression stats for time-series visualization."""
    return {"status": "success", "data": spatial_analytics.get_scenario_timeline(scenario_id)}

@router.get("/scenarios/{scenario_id}/exposure")
async def get_analytics_scenario_exposure(scenario_id: str):
    """Returns infrastructure hazard exposure and inundation vs. susceptibility intersection matrix."""
    return {"status": "success", "data": spatial_analytics.get_infrastructure_exposure(scenario_id)}

@router.get("/location")
async def get_analytics_location_profile(lat: float = Query(...), lon: float = Query(...)):
    """Samples actual raster values at specified coordinates without fabricating unavailable metrics."""
    return {"status": "success", "data": spatial_analytics.sample_location_profile(lat, lon)}
