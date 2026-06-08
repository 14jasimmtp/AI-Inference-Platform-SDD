import logging
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.logging_config import setup_logging
from app.config import settings
from app.exceptions import AppError
from app.api.router import router
from app.api.v1 import inference
from app.core.metrics import metrics_router, PrometheusMiddleware
from app.db.setup import setup_db

# Setup structured logging first
setup_logging(settings.LOG_LEVEL)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting AI Inference Platform", extra={"environment": settings.ENVIRONMENT})
    # Automated DB setup and migrations
    try:
        await setup_db()
    except Exception as e:
        logger.error(f"Failed to setup database: {e}")
        # In a real production app, you might want to exit here if DB is critical
        # raise
    yield
    logger.info("Shutting down AI Inference Platform")

app = FastAPI(
    title="AI Inference Platform",
    version="0.1.0",
    description="OpenAI-compatible inference API with multi-tenant auth",
    lifespan=lifespan,
    # Disable default /docs if desired in production
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus HTTP instrumentation middleware (auto-tracks all routes)
app.add_middleware(PrometheusMiddleware)

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

app.add_middleware(RequestResponseLoggingMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(LimitUploadSizeMiddleware, max_upload_size=5 * 1024 * 1024)

# Global exception handler for AppError hierarchy
@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    logger.warning(
        "AppError raised",
        extra={
            "error_code": exc.error_code,
            "error_message": exc.message,
            "path": request.url.path,
        }
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.error_code,
                "message": exc.message,
                "details": exc.details,
            }
        }
    )

# Health check
@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok", "version": "0.1.0"}

# Mount routers
app.include_router(router)                        # /api/v1/auth, /api/v1/api-keys
app.include_router(inference.router)              # /v1/chat/completions, /v1/models
app.include_router(metrics_router)                # /metrics (internal only, not via Traefik)

logger.info("Application initialized")
