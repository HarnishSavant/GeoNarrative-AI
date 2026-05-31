"""
GeoNarrative AI — FastAPI Backend
Main application entry point with Enterprise-grade modular routing and telemetry
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router
from app.middleware.logging_middleware import LoggingMiddleware
from app.middleware.saas_limit_middleware import SaaSLimitMiddleware
from app.middleware.rate_limit_middleware import RateLimitMiddleware
from app.core.config import settings

app = FastAPI(
    title="GeoNarrative AI API",
    description="Conversational GeoAI Digital Twin Platform — Backend API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Custom Telemetry & Latency Logging Middleware
app.add_middleware(LoggingMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(SaaSLimitMiddleware)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Enterprise Modular Router
app.include_router(api_router, prefix="/api/v1")


@app.on_event("startup")
async def startup_event():
    """Auto-create tables and auto-seed Pune geospatial digital twin data on server boot"""
    try:
        from app.core.database import engine, Base
        import app.models.db_models # Ensure all models are registered on Base
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("PostgreSQL/PostGIS tables verified/created successfully.")
    except Exception as e:
        print(f"Database table creation skipped/failed: {e}")

    try:
        from app.core.cache.seed_pune import seed, seed_database
        seed()
        await seed_database()
    except Exception as e:
        print(f"Auto-seeding Pune skipped/failed: {e}")


@app.get("/")
async def root():
    return {
        "name": "GeoNarrative AI API",
        "version": "1.0.0",
        "status": "active",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "geonarrative-ai-backend"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
