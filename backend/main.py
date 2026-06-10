"""
GeoNarrative AI — FastAPI Backend
Main application entry point with Enterprise-grade modular routing and telemetry
"""

# Load .env variables into os.environ BEFORE any other imports
# This ensures os.getenv() calls in auth.py, config.py, etc. can find .env values
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router
from app.middleware.logging_middleware import LoggingMiddleware
from app.middleware.saas_limit_middleware import SaaSLimitMiddleware
from app.middleware.rate_limit_middleware import RateLimitMiddleware
from app.core.config import settings

import logging
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import Request
from fastapi.responses import JSONResponse

logger = logging.getLogger("geonarrative_telemetry")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Auto-create tables and auto-seed Pune geospatial digital twin data on server boot asynchronously"""
    import asyncio
    asyncio.create_task(init_db_and_seed())
    yield

app = FastAPI(
    title="GeoNarrative AI API",
    description="Conversational GeoAI Digital Twin Platform — Backend API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    logger.error(f"Unhandled Exception: {exc}\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error. Please contact support or check server logs."},
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

async def init_db_and_seed():
    """Attempt to create database tables and seed Pune digital twin spatial datasets in the background"""
    db_ready = False
    try:
        from app.core.database import engine, Base
        import app.models.db_models # Ensure all models are registered on Base
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("PostgreSQL/PostGIS tables verified/created successfully.")
        db_ready = True
    except Exception as e:
        logger.warning(f"Database table creation skipped/failed (server will still start): {e}")

    # Seed database only if database connection succeeds
    if db_ready:
        try:
            from app.core.cache.seed_pune import seed, seed_database
            seed()
            await seed_database()
            logger.info("Auto-seeding Pune digital twin spatial datasets completed successfully.")
        except Exception as e:
            logger.warning(f"Auto-seeding Pune skipped/failed: {e}")
    else:
        # Still run file-based seed for local cache files
        try:
            from app.core.cache.seed_pune import seed
            seed()
        except Exception as e:
            logger.warning(f"Local cache seed skipped: {e}")





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


@app.get("/api/debug/gemini")
async def debug_gemini():
    """
    Diagnostic endpoint to safely test Gemini API connectivity.
    Tests: API key presence, model access, response generation.
    Does NOT expose the API key.
    """
    import httpx
    import time

    api_key = settings.GEMINI_API_KEY
    diagnostics = {
        "timestamp": datetime.now().isoformat(),
        "api_key_configured": bool(api_key),
        "api_key_prefix": api_key[:6] + "..." if api_key and len(api_key) > 6 else "N/A",
        "api_key_length": len(api_key) if api_key else 0,
        "model": "gemini-2.5-flash",
        "endpoint": "generativelanguage.googleapis.com/v1beta",
        "auth_method": "x-goog-api-key header",
        "connection_test": None,
        "response_test": None,
        "latency_ms": None,
        "error": None,
    }

    if not api_key:
        diagnostics["error"] = "GEMINI_API_KEY is empty or not set in .env"
        return diagnostics

    # Test actual API call
    model_name = "gemini-2.5-flash"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
    payload = {
        "contents": [{"role": "user", "parts": [{"text": "Reply with exactly: GEMINI_OK"}]}],
        "generationConfig": {"temperature": 0.0, "maxOutputTokens": 20}
    }
    headers = {
        "x-goog-api-key": api_key,
        "Content-Type": "application/json"
    }

    start = time.perf_counter()
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            latency = round((time.perf_counter() - start) * 1000, 1)
            diagnostics["latency_ms"] = latency

            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get("candidates", [])
                if candidates:
                    text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    diagnostics["connection_test"] = "SUCCESS"
                    diagnostics["response_test"] = text.strip()[:100]
                else:
                    diagnostics["connection_test"] = "SUCCESS (no candidates)"
                    diagnostics["response_test"] = "Empty response"
            else:
                diagnostics["connection_test"] = "FAILED"
                error_text = resp.text[:200] if resp.text else "No response body"
                diagnostics["error"] = f"HTTP {resp.status_code}: {error_text}"
    except Exception as e:
        diagnostics["connection_test"] = "FAILED"
        diagnostics["error"] = f"Connection error: {str(e)}"
        diagnostics["latency_ms"] = round((time.perf_counter() - start) * 1000, 1)

    return diagnostics


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
