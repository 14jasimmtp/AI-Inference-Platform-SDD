import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.logging_config import setup_logging
from app.config import settings
from app.exceptions import AppError
from app.api.router import router
from app.api.v1 import inference
from app.core.metrics import metrics_router
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
