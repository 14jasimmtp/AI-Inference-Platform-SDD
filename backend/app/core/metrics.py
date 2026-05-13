from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from fastapi import APIRouter
from fastapi.responses import Response

# Metrics
inference_requests_total = Counter(
    "inference_requests_total",
    "Total number of inference requests",
    ["model", "status"]
)

inference_duration_seconds = Histogram(
    "inference_duration_seconds",
    "Duration of inference requests in seconds",
    ["model"],
    buckets=[0.5, 1.0, 2.0, 3.0, 5.0, 10.0, 30.0, 60.0, 120.0]
)

inference_tokens_total = Counter(
    "inference_tokens_total",
    "Total tokens processed",
    ["model", "type"]  # type: prompt | completion
)

auth_attempts_total = Counter(
    "auth_attempts_total",
    "Total authentication attempts",
    ["method", "status"]  # method: jwt | api_key, status: success | failure
)

# Metrics router (not exposed via Traefik — internal only)
metrics_router = APIRouter()

@metrics_router.get("/metrics")
async def metrics():
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )
