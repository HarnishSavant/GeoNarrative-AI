import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.schemas import ChatRequest
from app.services.geoai.tool_agent import GeoAIToolAgent

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
        logger.info(f"Routing request to GeoAIToolAgent (Gemini Function Calling). Location: {location}, Message: '{request.message}'")
        
        # Route logic to the new Gemini Tool Calling execution layer
        response = await GeoAIToolAgent.generate_response(
            query=request.message,
            history=request.context or [],
            db=db,
            location=location,
            map_context=request.map_context,
            simulation_context=request.simulation_context
        )
        return response
