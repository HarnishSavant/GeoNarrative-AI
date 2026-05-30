from sqlalchemy import select, update, delete, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from geoalchemy2.shape import from_shape, to_shape
from shapely.geometry import Point, Polygon, MultiPolygon
from app.models.db_models import (
    User,
    UploadedDataset,
    FloodZone,
    Infrastructure,
    AIChatHistory,
    AnalyticsHistory,
    Report,
    Prediction,
)
from typing import List, Dict, Any, Optional

class DBRepository:
    """
    Enterprise Repository Pattern encapsulating asynchronous database operations
    and optimized PostGIS spatial queries for the Digital Twin engine.
    """

    # --- GENERAL CRUD PATTERNS ---

    @staticmethod
    async def create_user(session: AsyncSession, email: str, hashed_pw: str, name: str) -> User:
        user = User(email=email, hashed_password=hashed_pw, full_name=name)
        session.add(user)
        await session.flush()
        return user

    @staticmethod
    async def get_user_by_email(session: AsyncSession, email: str) -> Optional[User]:
        stmt = select(User).where(User.email == email)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def save_chat_message(session: AsyncSession, role: str, content: str, metadata: Optional[Dict] = None) -> AIChatHistory:
        chat = AIChatHistory(role=role, content=content, metadata_json=metadata)
        session.add(chat)
        await session.flush()
        return chat

    @staticmethod
    async def get_chat_history(session: AsyncSession, limit: int = 50) -> List[AIChatHistory]:
        stmt = select(AIChatHistory).order_by(AIChatHistory.timestamp.desc()).limit(limit)
        result = await session.execute(stmt)
        return list(reversed(result.scalars().all()))

    @staticmethod
    async def save_analytics(session: AsyncSession, location: str, metric: str, value: float) -> AnalyticsHistory:
        record = AnalyticsHistory(location_name=location, metric_name=metric, metric_value=value)
        session.add(record)
        await session.flush()
        return record

    @staticmethod
    async def get_analytics_by_location(session: AsyncSession, location: str) -> List[AnalyticsHistory]:
        stmt = select(AnalyticsHistory).where(AnalyticsHistory.location_name.ilike(location)).order_by(AnalyticsHistory.recorded_at.desc())
        result = await session.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def save_prediction(session: AsyncSession, location: str, rainfall: float, elevation: float, land_use: str, score: float, level: str, recs: List[str]) -> Prediction:
        prediction = Prediction(
            location_name=location,
            rainfall_intensity=rainfall,
            elevation=elevation,
            land_use=land_use,
            calculated_score=score,
            risk_level=level,
            recommendations=recs,
        )
        session.add(prediction)
        await session.flush()
        return prediction

    @staticmethod
    async def save_report(session: AsyncSession, location: str, report_type: str, summary: str, pdf_path: str) -> Report:
        report = Report(location_name=location, report_type=report_type, summary=summary, pdf_path=pdf_path)
        session.add(report)
        await session.flush()
        return report

    # --- ADVANCED GEOSPATIAL POSTGIS QUERIES ---

    @staticmethod
    async def create_infrastructure_node(
        session: AsyncSession, name: str, node_type: str, status: str, lng: float, lat: float
    ) -> Infrastructure:
        """Create a new point infrastructure node with WGS84 coordinate index"""
        point_geom = f"SRID=4326;POINT({lng} {lat})"
        node = Infrastructure(name=name, type=node_type, status=status, geom=point_geom)
        session.add(node)
        await session.flush()
        return node

    @staticmethod
    async def create_flood_zone(
        session: AsyncSession, name: str, risk_level: str, depth: float, multipolygon_wkt: str
    ) -> FloodZone:
        """Create a flood zone represented by WGS84 MultiPolygon WKT boundary"""
        # Ensure it maps properly with srid=4326 boundary representation
        zone_geom = f"SRID=4326;{multipolygon_wkt}"
        zone = FloodZone(name=name, risk_level=risk_level, inundation_depth=depth, geom=zone_geom)
        session.add(zone)
        await session.flush()
        return zone

    @staticmethod
    async def query_hospitals_in_flood_zones(session: AsyncSession) -> List[Dict[str, Any]]:
        """
        GEOSPATIAL QUERY 1: Hospitals inside active flood zones.
        Executes a PostGIS intersection query utilizing spatial GIST indexes:
        ST_Contains(zone.geom, hospital.geom)
        """
        stmt = (
            select(Infrastructure, FloodZone)
            .join(FloodZone, func.ST_Contains(FloodZone.geom, Infrastructure.geom))
            .where(Infrastructure.type.ilike("hospital"))
        )
        
        result = await session.execute(stmt)
        matches = []
        for infra, zone in result.all():
            matches.append({
                "hospital_id": infra.id,
                "hospital_name": infra.name,
                "status": infra.status,
                "flood_zone_id": zone.id,
                "flood_zone_name": zone.name,
                "flood_risk_level": zone.risk_level,
                "inundation_depth_meters": zone.inundation_depth,
            })
        return matches

    @staticmethod
    async def query_nearest_infrastructure(
        session: AsyncSession, center_lng: float, center_lat: float, limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        GEOSPATIAL QUERY 2: Nearest infrastructure node to specific coordinate.
        Utilizes the PostGIS Index Distance Operator '<->' (KNN search)
        which runs in O(log N) complexity using the GIST spatial index!
        """
        center_point = f"SRID=4326;POINT({center_lng} {center_lat})"
        
        # In SQL, this renders as: ORDER BY geom <-> ST_GeomFromText('POINT(lng lat)', 4326)
        stmt = (
            select(
                Infrastructure,
                func.ST_Distance(Infrastructure.geom, func.ST_GeomFromText(center_point, 4326)).label("distance_degrees")
            )
            .order_by(Infrastructure.geom.op("<->")(func.ST_GeomFromText(center_point, 4326)))
            .limit(limit)
        )
        
        result = await session.execute(stmt)
        nodes = []
        for infra, distance in result.all():
            # Convert degrees distance to approximate kilometers (1 degree ~= 111.1 km at equator)
            dist_km = distance * 111.1
            nodes.append({
                "id": infra.id,
                "name": infra.name,
                "type": infra.type,
                "status": infra.status,
                "distance_km": round(dist_km, 3),
            })
        return nodes

    @staticmethod
    async def query_buffer_analysis(
        session: AsyncSession, center_lng: float, center_lat: float, radius_km: float
    ) -> List[Dict[str, Any]]:
        """
        GEOSPATIAL QUERY 3: Spatial buffer analysis.
        Retrieves all infrastructure assets that fall inside a radial buffer boundary.
        Uses ST_DWithin on the indexed geometry column to bypass creating actual heavy buffer shapes:
        ST_DWithin(geom, center_geom, radius_degrees)
        """
        radius_degrees = radius_km / 111.1  # Translate kilometers to WGS84 degree radius
        center_point = f"SRID=4326;POINT({center_lng} {center_lat})"
        
        stmt = (
            select(Infrastructure)
            .where(func.ST_DWithin(Infrastructure.geom, func.ST_GeomFromText(center_point, 4326), radius_degrees))
        )
        
        result = await session.execute(stmt)
        assets = []
        for infra in result.scalars().all():
            assets.append({
                "id": infra.id,
                "name": infra.name,
                "type": infra.type,
                "status": infra.status,
            })
        return assets
