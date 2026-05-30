"""
GeoNarrative AI — Backend Configuration
"""

import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""

    # App
    APP_NAME: str = "GeoNarrative AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # API Keys
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    MAPBOX_TOKEN: str = os.getenv("MAPBOX_TOKEN", "")
    WEATHER_API_KEY: str = os.getenv("WEATHER_API_KEY", "")

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "https://*.vercel.app",
    ]

    # Database (optional — using in-memory for MVP)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./geonarrative.db")

    class Config:
        env_file = ".env"


settings = Settings()
