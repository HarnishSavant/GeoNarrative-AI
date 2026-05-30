from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.db_repository import DBRepository
from typing import List, Dict, Any, Optional

class DatabaseService:
    """
    Database Service Orchestrator acting as a unified API bridge between the
    REST controller endpoints and the raw DBRepository query logic.
    """

    @staticmethod
    async def register_user(session: AsyncSession, email: str, hashed_pw: str, name: str) -> Dict[str, Any]:
        user = await DBRepository.create_user(session, email, hashed_pw, name)
        return {"id": user.id, "email": user.email, "full_name": user.full_name, "status": "registered"}

    @staticmethod
    async def fetch_user(session: AsyncSession, email: str) -> Optional[Dict[str, Any]]:
        user = await DBRepository.get_user_by_email(session, email)
        if not user:
            return None
        return {"id": user.id, "email": user.email, "full_name": user.full_name}

    @staticmethod
    async def log_chat(session: AsyncSession, role: str, content: str, metadata: Optional[Dict] = None) -> Dict[str, Any]:
        chat = await DBRepository.save_chat_message(session, role, content, metadata)
        return {"id": chat.id, "role": chat.role, "content": chat.content, "timestamp": chat.timestamp.isoformat()}

    @staticmethod
    async def get_chats(session: AsyncSession, limit: int = 50) -> List[Dict[str, Any]]:
        chats = await DBRepository.get_chat_history(session, limit)
        return [
            {"id": c.id, "role": c.role, "content": c.content, "timestamp": c.timestamp.isoformat(), "metadata": c.metadata_json}
            for c in chats
        ]

    @staticmethod
    async def track_metric(session: AsyncSession, location: str, metric: str, value: float) -> Dict[str, Any]:
        record = await DBRepository.save_analytics(session, location, metric, value)
        return {"id": record.id, "location": record.location_name, "metric": record.metric_name, "value": record.metric_value}

    @staticmethod
    async def log_prediction(
        session: AsyncSession, location: str, rainfall: float, elevation: float, land_use: str, score: float, level: str, recs: List[str]
    ) -> Dict[str, Any]:
        pred = await DBRepository.save_prediction(session, location, rainfall, elevation, land_use, score, level, recs)
        return {
            "id": pred.id,
            "location": pred.location_name,
            "risk_score": pred.calculated_score,
            "risk_level": pred.risk_level,
            "timestamp": pred.created_at.isoformat(),
        }

    # --- GEOSPATIAL SERVICES ---

    @staticmethod
    async def add_infrastructure(
        session: AsyncSession, name: str, node_type: str, status: str, lng: float, lat: float
    ) -> Dict[str, Any]:
        node = await DBRepository.create_infrastructure_node(session, name, node_type, status, lng, lat)
        return {"id": node.id, "name": node.name, "type": node.type, "status": node.status}

    @staticmethod
    async def add_flood_zone(
        session: AsyncSession, name: str, risk_level: str, depth: float, multipolygon_wkt: str
    ) -> Dict[str, Any]:
        zone = await DBRepository.create_flood_zone(session, name, risk_level, depth, multipolygon_wkt)
        return {"id": zone.id, "name": zone.name, "risk_level": zone.risk_level, "depth_meters": zone.inundation_depth}

    @staticmethod
    async def analyze_hospitals_in_flood(session: AsyncSession) -> List[Dict[str, Any]]:
        return await DBRepository.query_hospitals_in_flood_zones(session)

    @staticmethod
    async def get_nearest_assets(
        session: AsyncSession, center_lng: float, center_lat: float, limit: int = 5
    ) -> List[Dict[str, Any]]:
        return await DBRepository.query_nearest_infrastructure(session, center_lng, center_lat, limit)

    @staticmethod
    async def run_radial_buffer(
        session: AsyncSession, center_lng: float, center_lat: float, radius_km: float
    ) -> List[Dict[str, Any]]:
        return await DBRepository.query_buffer_analysis(session, center_lng, center_lat, radius_km)
