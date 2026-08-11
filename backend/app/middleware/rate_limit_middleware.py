import time
from fastapi import Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.models.db_models import AuditLog

# IP-based rate limiting dictionaries
ip_requests = {}
ai_requests = {}
RATE_LIMIT = 1000 # requests per minute for standard routes (elevated to prevent visual GIS stuttering)
AI_RATE_LIMIT = 20 # strict limit for LLM/Reporting routes
WINDOW = 60 # seconds

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Exclude health queries, documentation, and high-frequency digital twin GIS flood/tile endpoints from rate limit
        path = request.url.path
        if path in ["/", "/health", "/docs", "/openapi.json"] or path.startswith("/api/v1/flood") or path.startswith("/api/geojson") or path.startswith("/api/data") or path.startswith("/api/gis"):
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        current_time = time.time()
        
        # Load request timestamps for active IP
        is_ai_route = path.startswith("/api/v1/chat") or path.startswith("/api/v1/report")
        target_dict = ai_requests if is_ai_route else ip_requests
        limit = AI_RATE_LIMIT if is_ai_route else RATE_LIMIT
        
        timestamps = target_dict.get(client_ip, [])
        
        # Filter timestamps outside window
        timestamps = [t for t in timestamps if current_time - t < WINDOW]
        target_dict[client_ip] = timestamps
        
        if len(timestamps) >= limit:
            # Audit log rate limit triggers in database using immediate session
            try:
                async with AsyncSessionLocal() as db:
                    audit = AuditLog(
                        event_type="rate_limit_hit",
                        resource=path,
                        status="failure",
                        details=f"IP {client_ip} throttled: exceeded limit of {limit} req/min."
                    )
                    db.add(audit)
                    await db.commit()
            except Exception as e:
                print(f"Failed to record rate limit hit to audit logs: {e}")
                
            return Response(
                content=f'{{"detail": "Rate limit exceeded. Maximum {limit} requests per minute. Please retry shortly."}}',
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                media_type="application/json",
                headers={"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "*", "Access-Control-Allow-Headers": "*"}
            )
            
        target_dict[client_ip].append(current_time)
        return await call_next(request)

