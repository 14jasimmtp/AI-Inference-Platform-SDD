import logging
import time
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

class RequestResponseLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        logger.info(
            f"Incoming request: {request.method} {request.url.path}",
            extra={
                "method": request.method,
                "path": request.url.path,
                "client_ip": request.client.host if request.client else None
            }
        )
        
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            
            logger.info(
                f"Response: {request.method} {request.url.path} completed in {process_time:.4f}s with status {response.status_code}",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "process_time": process_time,
                }
            )
            response.headers["X-Process-Time"] = str(process_time)
            return response
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(
                f"Request failed: {request.method} {request.url.path} after {process_time:.4f}s",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "process_time": process_time,
                    "error": str(e)
                },
                exc_info=True
            )
            raise e

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

class LimitUploadSizeMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_upload_size: int):
        super().__init__(app)
        self.max_upload_size = max_upload_size

    async def dispatch(self, request: Request, call_next):
        if request.headers.get("content-length"):
            if int(request.headers["content-length"]) > self.max_upload_size:
                return JSONResponse(status_code=413, content={"detail": "Payload Too Large"})
        return await call_next(request)
