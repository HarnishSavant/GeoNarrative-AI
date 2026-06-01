from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.schemas import ChatRequest, ChatResponse
from app.services.chat_service import ChatService
from app.api.v1.endpoints.auth import get_current_user
from app.models.db_models import User

router = APIRouter()

@router.post("", response_model=ChatResponse)
async def chat(
    request: ChatRequest, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """AI Chat endpoint — processes natural language GIS queries"""
    response_data = await ChatService.generate_chat_response(request, db)
    return response_data
