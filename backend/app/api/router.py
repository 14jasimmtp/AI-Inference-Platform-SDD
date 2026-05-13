from fastapi import APIRouter
from app.api.v1 import auth, api_keys, inference

router = APIRouter(prefix="/api")

# v1 routers
router.include_router(auth.router, prefix="/v1")
router.include_router(api_keys.router, prefix="/v1")
# Inference routes are at /v1/chat/... — not under /api prefix
