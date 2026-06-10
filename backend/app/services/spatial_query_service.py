import logging
from typing import List, Dict, Any
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.db_models import Infrastructure, FloodZone, AnalyticsHistory

logger = logging.getLogger("geonarrative.spatial_query_service")



class SpatialQueryService:
    """
    Dedicated PostGIS Spatial Query Engine.
    Executes raw and SQLAlchemy-wrapped geospatial query logic inside the
    PostgreSQL PostGIS database, leveraging spatial indexes for O(log N) KNN operations.
    """

    @staticmethod
    async def get_total_feature_counts(session: AsyncSession) -> Dict[str, int]:
        """Returns the total count of each infrastructure type in the current city bounds."""
        stmt = select(Infrastructure.type, func.count(Infrastructure.id)).group_by(Infrastructure.type)
        result = await session.execute(stmt)
        counts = {type_: count for type_, count in result.all()}
        
        # Also count roads and rivers from FloodZone
        road_stmt = select(func.count(FloodZone.id)).where(FloodZone.name.like("[roads]%"))
        road_res = await session.execute(road_stmt)
        counts["roads"] = road_res.scalar() or 0
        
        river_stmt = select(func.count(FloodZone.id)).where(FloodZone.name.like("[rivers]%"))
        river_res = await session.execute(river_stmt)
        counts["rivers"] = river_res.scalar() or 0
        
        return counts

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
                func.min(func.ST_Distance(Infrastructure.geom, FloodZone.geom)).label("dist")
            )
            .join(FloodZone, func.ST_DWithin(Infrastructure.geom, FloodZone.geom, distance_degrees))
            .where(
                and_(
                    Infrastructure.type.ilike("school"),
                    FloodZone.name.like("[rivers]%")
                )
            )
            .group_by(Infrastructure.id)
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

        # Query all roads from FloodZone table
        roads_stmt = select(FloodZone).where(FloodZone.name.like("[roads]%"))
        roads_result = await session.execute(roads_stmt)
        roads = roads_result.scalars().all()

        for road in roads:
            # Check intersections with high/critical flood zones (like rivers)
            stmt = (
                select(FloodZone)
                .where(
                    and_(
                        FloodZone.risk_level.in_(["high", "critical"]),
                        FloodZone.id != road.id,
                        func.ST_Intersects(road.geom, FloodZone.geom)
                    )
                )
            )
            
            result = await session.execute(stmt)
            zones = result.scalars().all()
            
            if zones:
                max_depth = max(z.inundation_depth for z in zones)
                highest_risk = "critical" if any(z.risk_level == "critical" for z in zones) else "high"
                results.append({
                    "road_name": road.name.replace("[roads] ", ""),
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

    @staticmethod
    async def query_infrastructure_exposure_summary(session: AsyncSession) -> Dict[str, Any]:
        """
        Query 7: Infrastructure exposure summary aggregated by domain.
        Queries the active PostGIS database and categorizes vulnerable assets by domain.
        """
        logger.info("Executing PostGIS query: Infrastructure exposure summary by domain.")
        
        # 1. Flood domain: count facilities in flood zones
        flood_stmt = (
            select(FloodZone.risk_level, func.count(Infrastructure.id))
            .join(Infrastructure, func.ST_Contains(FloodZone.geom, Infrastructure.geom))
            .group_by(FloodZone.risk_level)
        )
        res_flood = await session.execute(flood_stmt)
        flood_counts = {level: count for level, count in res_flood.all()}
        
        # 2. Traffic domain: count of flood-prone road intersections
        prone_roads = await SpatialQueryService.query_flood_prone_roads(session)
        traffic_exposure = len(prone_roads)
        
        # 3. Urban domain: count of zoning violations / buildings in vulnerable hazard areas
        violations = await SpatialQueryService.query_buildings_intersecting_vulnerable_areas(session)
        urban_exposure = len(violations)
        
        # 4. Utility domain: substations in critical/high risk zones
        high_risk_infra = await SpatialQueryService.query_high_risk_infrastructure(session)
        substations_at_risk = len([i for i in high_risk_infra if i["type"] == "substation"])
        
        total_exposed = sum(flood_counts.values()) + traffic_exposure + urban_exposure + substations_at_risk
        
        return {
            "total_exposed_assets": total_exposed,
            "domains": {
                "flood": {
                    "exposed_assets_count": sum(flood_counts.values()),
                    "by_risk_level": flood_counts
                },
                "traffic": {
                    "impacted_corridors_count": traffic_exposure,
                    "roads": [r["road_name"] for r in prone_roads]
                },
                "urban": {
                    "zoning_violations_count": urban_exposure,
                    "violations": [
                        {"name": v["asset_name"], "zone": v["intersecting_zone"], "risk": v["risk_level"]}
                        for v in violations
                    ]
                },
                "utility": {
                    "vulnerable_substations_count": substations_at_risk
                }
            }
        }

