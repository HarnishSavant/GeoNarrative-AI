import time
from fastapi import Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.models.db_models import AuditLog

# IP-based rate limiting dictionary
ip_requests = {}
RATE_LIMIT = 100 # requests per minute
WINDOW = 60 # seconds

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Exclude local health queries or doc assets to prevent false triggers
        path = request.url.path
        if path in ["/", "/health", "/docs", "/openapi.json"]:
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        current_time = time.time()
        
        # Load request timestamps for active IP
        timestamps = ip_requests.get(client_ip, [])
        
        # Filter timestamps outside window
        timestamps = [t for t in timestamps if current_time - t < WINDOW]
        ip_requests[client_ip] = timestamps
        
        if len(timestamps) >= RATE_LIMIT:
            # Audit log rate limit triggers in database using immediate session
            try:
                async with AsyncSessionLocal() as db:
                    audit = AuditLog(
                        event_type="rate_limit_hit",
                        resource=path,
                        status="failure",
                        details=f"IP {client_ip} throttled: exceeded limit of {RATE_LIMIT} req/min."
                    )
                    db.add(audit)
                    await db.commit()
            except Exception as e:
                print(f"Failed to record rate limit hit to audit logs: {e}")
                
            return Response(
                content='{"detail": "Rate limit exceeded. Maximum 100 requests per minute. Please retry shortly."}',
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                media_type="application/json"
            )
            
        ip_requests[client_ip].append(current_time)
        return await call_next(request)
