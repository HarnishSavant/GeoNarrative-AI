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
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    # API Keys
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    MAPBOX_TOKEN: str = os.getenv("MAPBOX_TOKEN", "")
    WEATHER_API_KEY: str = os.getenv("WEATHER_API_KEY", "")

    # JWT Secret Key — stable across restarts
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")

    # Razorpay Payment Gateway
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "")

    # CORS — restricted to known origins only
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ]

    # Database — PostgreSQL required, no SQLite fallback
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:root@localhost:5432/geonarrative")

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"  # Don't crash on unknown .env variables like razorpay keys or other additions
    )


settings = Settings()
