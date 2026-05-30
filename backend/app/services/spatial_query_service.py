import logging
from typing import List, Dict, Any
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.db_models import Infrastructure, FloodZone, AnalyticsHistory

logger = logging.getLogger("geonarrative.spatial_query_service")

# Georeferenced WKT course of the Mula-Mutha River in Pune (SRID 4326)
PUNE_RIVER_WKT = "SRID=4326;LINESTRING(73.8012 18.5204, 73.8155 18.5280, 73.8312 18.5325, 73.8456 18.5348, 73.8589 18.5312, 73.8722 18.5385, 73.8890 18.5410, 73.9056 18.5365)"

# Georeferenced WKT course of key highway road corridors in Pune
PUNE_ROADS_WKT = {
    "Karve Road": "SRID=4326;LINESTRING(73.8300 18.5100, 73.8400 18.5150, 73.8500 18.5200, 73.8600 18.5250)",
    "Fergusson College Road": "SRID=4326;LINESTRING(73.8400 18.5300, 73.8420 18.5200, 73.8450 18.5100)",
    "Pune Station Overpass": "SRID=4326;LINESTRING(73.8700 18.5450, 73.8750 18.5380, 73.8800 18.5300)",
    "Jangali Maharaj Road": "SRID=4326;LINESTRING(73.8500 18.5350, 73.8580 18.5310, 73.8680 18.5340)"
}


class SpatialQueryService:
    """
    Dedicated PostGIS Spatial Query Engine.
    Executes raw and SQLAlchemy-wrapped geospatial query logic inside the
    PostgreSQL PostGIS database, leveraging spatial indexes for O(log N) KNN operations.
    """

    @staticmethod
    async def query_hospitals_in_flood_zones(session: AsyncSession) -> List[Dict[str, Any]]:
        """
        Query 1: Identify hospitals inside flood zones.
        Uses: ST_Contains(zone.geom, hospital.geom)
        """
        logger.info("Executing PostGIS query: Hospitals inside flood zones.")
        stmt = (
            select(Infrastructure, FloodZone)
            .join(FloodZone, func.ST_Contains(FloodZone.geom, Infrastructure.geom))
            .where(Infrastructure.type.ilike("hospital"))
        )
        
        result = await session.execute(stmt)
        results = []
        for infra, zone in result.all():
            results.append({
                "id": infra.id,
                "name": infra.name,
                "type": infra.type,
                "status": infra.status,
                "zone_name": zone.name,
                "risk_level": zone.risk_level,
                "inundation_depth_m": zone.inundation_depth
            })
        return results

    @staticmethod
    async def query_schools_near_rivers(session: AsyncSession, distance_m: float = 500.0) -> List[Dict[str, Any]]:
        """
        Query 2: Identify school facilities within 500m of rivers.
        Uses: ST_Distance(geom, ST_GeomFromText(river_wkt, 4326))
        Degree equivalent: 500m ~= 0.0045 degrees.
        """
        logger.info(f"Executing PostGIS query: Schools within {distance_m}m of rivers.")
        distance_degrees = distance_m / 111120.0  # Approx degree conversion

        stmt = (
            select(
                Infrastructure,
                func.ST_Distance(Infrastructure.geom, func.ST_GeomFromText(PUNE_RIVER_WKT, 4326)).label("dist")
            )
            .where(
                and_(
                    Infrastructure.type.ilike("school"),
                    func.ST_DWithin(Infrastructure.geom, func.ST_GeomFromText(PUNE_RIVER_WKT, 4326), distance_degrees)
                )
            )
            .order_by("dist")
        )

        result = await session.execute(stmt)
        results = []
        for infra, dist in result.all():
            results.append({
                "id": infra.id,
                "name": infra.name,
                "type": infra.type,
                "distance_meters": round(dist * 111120.0, 1),
                "status": infra.status
            })
        return results

    @staticmethod
    async def query_nearest_shelters(session: AsyncSession, center_lng: float, center_lat: float, limit: int = 3) -> List[Dict[str, Any]]:
        """
        Query 3: Nearest emergency shelters search using spatial index KNN.
        Uses: PostGIS Index Distance Operator '<->' for O(log N) R-Tree search
        """
        logger.info(f"Executing PostGIS KNN search: shelters near ({center_lng}, {center_lat}).")
        center_point = f"SRID=4326;POINT({center_lng} {center_lat})"

        stmt = (
            select(
                Infrastructure,
                func.ST_Distance(Infrastructure.geom, func.ST_GeomFromText(center_point, 4326)).label("dist")
            )
            .where(Infrastructure.type.ilike("shelter"))
            .order_by(Infrastructure.geom.op("<->")(func.ST_GeomFromText(center_point, 4326)))
            .limit(limit)
        )

        result = await session.execute(stmt)
        results = []
        for infra, dist in result.all():
            results.append({
                "id": infra.id,
                "name": infra.name,
                "type": infra.type,
                "distance_km": round(dist * 111.12, 3),
                "status": infra.status
            })
        return results

    @staticmethod
    async def query_high_risk_infrastructure(session: AsyncSession) -> List[Dict[str, Any]]:
        """
        Query 4: Identify all high-risk infrastructure nodes inside high or critical floodways.
        Uses: ST_Contains(zone.geom, infra.geom) filtered by risk level.
        """
        logger.info("Executing PostGIS query: High-risk infrastructure regions.")
        stmt = (
            select(Infrastructure, FloodZone)
            .join(FloodZone, func.ST_Contains(FloodZone.geom, Infrastructure.geom))
            .where(FloodZone.risk_level.in_(["high", "critical"]))
        )

        result = await session.execute(stmt)
        results = []
        for infra, zone in result.all():
            results.append({
                "id": infra.id,
                "name": infra.name,
                "type": infra.type,
                "status": infra.status,
                "intersecting_zone": zone.name,
                "risk_level": zone.risk_level,
                "inundation_depth_m": zone.inundation_depth
            })
        return results

    @staticmethod
    async def query_buildings_intersecting_vulnerable_areas(session: AsyncSession) -> List[Dict[str, Any]]:
        """
        Query 5: Mapped buildings intersecting critical hazard zones.
        Since we represent high density assets as points or polygons inside `infrastructure` (substations/assets),
        we perform an intersection with designated high-risk floodways:
        Uses: ST_Intersects(infra.geom, zone.geom)
        """
        logger.info("Executing PostGIS query: Buildings intersecting vulnerable areas.")
        stmt = (
            select(Infrastructure, FloodZone)
            .join(FloodZone, func.ST_Intersects(Infrastructure.geom, FloodZone.geom))
            .where(Infrastructure.type.in_(["substation", "asset", "hospital"]))
        )

        result = await session.execute(stmt)
        results = []
        for infra, zone in result.all():
            results.append({
                "asset_name": infra.name,
                "asset_type": infra.type,
                "intersecting_zone": zone.name,
                "risk_level": zone.risk_level,
                "regulatory_action": "Mandatory structural reinforcement audit" if zone.risk_level == "critical" else "Standard zoning warning"
            })
        return results

    @staticmethod
    async def query_flood_prone_roads(session: AsyncSession) -> List[Dict[str, Any]]:
        """
        Query 6: Identify flood-prone road corridors.
        Executes a PostGIS line-in-polygon intersection check:
        ST_Intersects(ST_GeomFromText(road_line, 4326), zone.geom)
        """
        logger.info("Executing PostGIS query: Flood-prone road corridors.")
        results = []

        # Audit each key roadway vector stored as WKT in our registry against active database floodway zones
        for road_name, road_wkt in PUNE_ROADS_WKT.items():
            stmt = (
                select(FloodZone)
                .where(func.ST_Intersects(func.ST_GeomFromText(road_wkt, 4326), FloodZone.geom))
            )
            
            result = await session.execute(stmt)
            zones = result.scalars().all()
            
            if zones:
                max_depth = max(z.inundation_depth for z in zones)
                highest_risk = "critical" if any(z.risk_level == "critical" for z in zones) else "high"
                results.append({
                    "road_name": road_name,
                    "is_flood_prone": True,
                    "max_inundation_depth_m": round(max_depth, 2),
                    "highest_risk_level": highest_risk,
                    "impacted_sectors": [z.name for z in zones]
                })
        return results

    # --- DIGITAL TWIN MODE CONNECTORS ---

    @staticmethod
    async def execute_mode_analysis(session: AsyncSession, mode: str) -> Dict[str, Any]:
        """
        Executes dedicated dynamic spatial queries for all 4 Digital Twin Modes:
        Returns structured lists of affected features, metrics, and actionable recommendations.
        """
        if mode == "flood":
            vuln_hospitals = await SpatialQueryService.query_hospitals_in_flood_zones(session)
            prone_roads = await SpatialQueryService.query_flood_prone_roads(session)
            near_schools = await SpatialQueryService.query_schools_near_rivers(session, distance_m=500)
            
            return {
                "vulnerable_hospitals": vuln_hospitals,
                "flood_prone_corridors": prone_roads,
                "schools_near_riverways": near_schools,
                "kpis": {
                    "vulnerable_facilities_count": len(vuln_hospitals),
                    "impacted_corridors_count": len(prone_roads),
                    "average_flood_depth_m": round(sum(h["inundation_depth_m"] for h in vuln_hospitals) / max(1, len(vuln_hospitals)), 2)
                }
            }
            
        elif mode == "traffic":
            prone_roads = await SpatialQueryService.query_flood_prone_roads(session)
            nearest_shelters = await SpatialQueryService.query_nearest_shelters(session, 73.8562, 18.5320, limit=3)
            
            return {
                "congested_corridors": [
                    {
                        "road_name": rd["road_name"],
                        "incident_risk": rd["highest_risk_level"],
                        "est_delay_mins": 25 if rd["highest_risk_level"] == "critical" else 15,
                        "rerouting_shelters": nearest_shelters
                    } for rd in prone_roads
                ],
                "kpis": {
                    "clogged_segments_count": len(prone_roads),
                    "logistics_priority": "critical" if any(r["highest_risk_level"] == "critical" for r in prone_roads) else "medium",
                    "backup_routes_available": len(nearest_shelters)
                }
            }
            
        elif mode == "urban":
            violations = await SpatialQueryService.query_buildings_intersecting_vulnerable_areas(session)
            
            return {
                "zoning_violations": [
                    {
                        "asset_name": v["asset_name"],
                        "asset_type": v["asset_type"],
                        "encroachment_zone": v["intersecting_zone"],
                        "compliance_status": "non-compliant (hazard-risk-overlay)",
                        "required_remediation": v["regulatory_action"]
                    } for v in violations
                ],
                "kpis": {
                    "zoning_violations_count": len(violations),
                    "compliance_ratio_pct": round((12 - len(violations)) / 12 * 100, 1)
                }
            }
            
        elif mode == "utility":
            high_risk_infra = await SpatialQueryService.query_high_risk_infrastructure(session)
            substations_at_risk = [i for i in high_risk_infra if i["type"] == "substation"]
            
            return {
                "endangered_substations": substations_at_risk,
                "kpis": {
                    "endangered_grid_nodes": len(substations_at_risk),
                    "grid_stability_rating": "unstable" if len(substations_at_risk) > 0 else "nominal"
                }
            }
            
        else:
            raise ValueError(f"Unsupported analysis mode: {mode}")
