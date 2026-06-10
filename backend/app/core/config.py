"""
GeoNarrative AI — Backend Configuration
Loads all settings from environment variables. No hardcoded secrets.
"""
import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings — all values loaded from .env"""

    # App
    APP_NAME: str = "GeoNarrative AI"
    APP_VERSION: str = "1.4.0"
    DEBUG: bool = False

    # API Keys
    GEMINI_API_KEY: str = ""
    MAPBOX_TOKEN: str = ""
    WEATHER_API_KEY: str = ""

    # JWT Secret Key — stable across restarts
    SECRET_KEY: str = ""

    # Razorpay Payment Gateway
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""

    # CORS — restricted to known origins only
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ]

    # Database — PostgreSQL required, no SQLite fallback
    DATABASE_URL: str = "postgresql://postgres:root@localhost:5432/geonarrative"

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

