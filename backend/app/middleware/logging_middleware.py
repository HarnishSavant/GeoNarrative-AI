import time
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("geonarrative_telemetry")

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        method = request.method
        url = request.url.path
        
        # Avoid console flood spam from high-frequency 3D simulation animations and raster tile streaming
        is_high_freq = url.startswith("/api/v1/flood") or url.startswith("/api/geojson") or url.startswith("/api/data") or url.startswith("/api/gis")
        if not is_high_freq:
            client_host = request.client.host if request.client else "unknown"
            logger.info(f"Incoming request: {method} {url} from {client_host}")
        
        response = await call_next(request)
        
        process_time = (time.time() - start_time) * 1000  # Convert to ms
        if not is_high_freq:
            logger.info(f"Response: {method} {url} completed in {process_time:.2f}ms with status {response.status_code}")
        
        # Add latency telemetry headers to standard response
        response.headers["X-Process-Latency-Ms"] = f"{process_time:.2f}"
        
        return response

