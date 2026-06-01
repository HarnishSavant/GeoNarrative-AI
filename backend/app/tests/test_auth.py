import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.db_models import User

@pytest.mark.asyncio
async def test_user_registration_success(client: AsyncClient, db_session: AsyncSession):
    """Asserts that standard valid demographic inputs register users securely."""
    payload = {
        "full_name": "Planner One",
        "username": "planner1",
        "email": "planner1@geonarrative.ai",
        "password": "SecurePassword123!",
        "confirm_password": "SecurePassword123!",
        "industry": "GIS Engineering",
        "designation": "Lead Topographer"
    }
    
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "planner1"
    assert data["email"] == "planner1@geonarrative.ai"
    assert data["role"] == "admin"  # The very first user dynamically gets assigned the admin role!
    
    # Assert database persistence
    result = await db_session.execute(select(User).filter(User.username == "planner1"))
    user = result.scalars().first()
    assert user is not None
    assert user.role == "admin"
    assert user.is_verified is False # Must go through outbox activation flow


@pytest.mark.asyncio
async def test_registration_password_mismatch(client: AsyncClient):
    """Asserts that password confirmation mismatches trigger structural validation alerts."""
    payload = {
        "full_name": "Planner Two",
        "username": "planner2",
        "email": "planner2@geonarrative.ai",
        "password": "Password123!",
        "confirm_password": "PasswordMismatched123!",
        "industry": "Government Planning",
        "designation": "Spatial Lead"
    }
    
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 400
    assert "Passwords do not match" in response.json()["detail"]


@pytest.mark.asyncio
async def test_registration_password_strength_rejection(client: AsyncClient):
    """Asserts that weak passwords fail security complexity validation."""
    payload = {
        "full_name": "Planner Three",
        "username": "planner3",
        "email": "planner3@geonarrative.ai",
        "password": "weak",
        "confirm_password": "weak",
        "industry": "Disaster Planning",
        "designation": "Civil Lead"
    }
    
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 400
    assert "at least 8 characters" in response.json()["detail"]


@pytest.mark.asyncio
async def test_unauthenticated_profile_access_blocked(client: AsyncClient):
    """Asserts that unauthenticated queries on secured routes fail with 401 Unauthorized."""
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401
