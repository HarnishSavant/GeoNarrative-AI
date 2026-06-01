import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.schemas import ChatRequest
from app.services.geoai_orchestrator import GeoAIOrchestrator

logger = logging.getLogger("geonarrative.chat_service")

class ChatService:
    """
    RAG-enabled Conversational GeoAI Service.
    Intersects natural language queries with live spatial analysis results.
    Bridges vector geometries, raster grids, and database metrics with LLM reasoning.
    """

    @staticmethod
    async def generate_chat_response(request: ChatRequest, db: AsyncSession) -> dict:
        location = request.location or "Pune"
        logger.info(f"Routing request to GeoAIOrchestrator. Location: {location}, Message: '{request.message}'")
        
        # Route logic directly to the LangChain-inspired GeoAIOrchestrator
        response = await GeoAIOrchestrator.generate_response(
            query=request.message,
            location=location,
            history=request.context or [],
            db=db,
            uploaded_files=request.uploaded_files
        )
        return response
