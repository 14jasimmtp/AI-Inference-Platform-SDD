import time
import logging
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from fastapi import APIRouter, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from fastapi import HTTPException, Header
import re

logger = logging.getLogger(__name__)

# ── Inference-specific metrics ────────────────────────────────────────────────

inference_requests_total = Counter(
    "inference_requests_total",
    "Total number of inference requests",
    ["model", "status", "user_id", "org_id"]
)

inference_duration_seconds = Histogram(
    "inference_duration_seconds",
    "Duration of inference requests in seconds",
    ["model", "user_id", "org_id"],
    buckets=[0.5, 1.0, 2.0, 3.0, 5.0, 10.0, 30.0, 60.0, 120.0]
)

inference_tokens_total = Counter(
    "inference_tokens_total",
    "Total tokens processed",
    ["model", "type", "user_id", "org_id"]  # type: prompt | completion
)

auth_attempts_total = Counter(
    "auth_attempts_total",
    "Total authentication attempts",
    ["method", "status"]  # method: jwt | api_key, status: success | failure
)

# ── HTTP-level metrics (all routes) ──────────────────────────────────────────

http_requests_total = Counter(
    "http_requests_total",
    "Total HTTP requests received",
    ["method", "path", "status_code"]
)

http_request_duration_seconds = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "path"],
    buckets=[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
)

http_active_connections = Gauge(
    "http_active_connections",
    "Number of active HTTP connections currently being handled"
)


# ── ASGI Middleware: auto-instrument every HTTP route ─────────────────────────

class PrometheusMiddleware(BaseHTTPMiddleware):
    """
    Wraps every incoming ASGI request to record http_requests_total,
    http_request_duration_seconds, and http_active_connections.
    Excluded paths: /metrics, /health (to avoid noise in dashboards).
    """

    EXCLUDED_PATHS = {"/metrics", "/health", "/favicon.ico"}

    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # Skip instrumentation for excluded utility endpoints
        if path in self.EXCLUDED_PATHS:
            return await call_next(request)
            
        # Normalize paths to prevent cardinality explosion
        normalized_path = re.sub(r'[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}', '{id}', path)
        normalized_path = re.sub(r'/[0-9]+', '/{id}', normalized_path)

        http_active_connections.inc()
        start_time = time.perf_counter()

        try:
            response: Response = await call_next(request)
            status_code = response.status_code
        except Exception:
            status_code = 500
            raise
        finally:
            duration = time.perf_counter() - start_time
            http_active_connections.dec()

            http_requests_total.labels(
                method=request.method,
                path=normalized_path,
                status_code=str(status_code),
            ).inc()

            http_request_duration_seconds.labels(
                method=request.method,
                path=normalized_path,
            ).observe(duration)

        return response


# ── Metrics endpoint (internal only, not exposed through Traefik) ─────────────

metrics_router = APIRouter()


@metrics_router.get("/metrics")
async def metrics(authorization: str = Header(None)):
    if authorization != "Bearer platform-internal-metrics":
        raise HTTPException(status_code=401, detail="Unauthorized")
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )
