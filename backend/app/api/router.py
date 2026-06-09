# pyrefly: ignore [missing-import]
from fastapi import APIRouter
from app.modules.auth import router as auth
from app.modules.api_keys import router as api_keys
from app.modules.orgs import router as orgs
from app.modules.users import router as users

router = APIRouter(prefix="/api")

# v1 routers
router.include_router(auth.router, prefix="/v1")
router.include_router(api_keys.router, prefix="/v1")
router.include_router(orgs.router, prefix="/v1")
router.include_router(users.router, prefix="/v1")
# Inference routes are at /v1/chat/... — not under /api prefix
