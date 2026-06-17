import logging
from typing import Optional
from fastapi import APIRouter, Depends, Header
from fastapi.responses import StreamingResponse
from app.modules.inference.schemas import ChatCompletionRequest, ChatCompletionResponse, ModelListResponse
from app.modules.inference.service import inference_service
from app.core.dependencies import get_api_key_user
from app.modules.users.models import User
from app.core.rate_limiter import rate_limiter
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(tags=["inference"])

@router.get("/v1/models", response_model=ModelListResponse)
async def list_models(
    auth: tuple = Depends(get_api_key_user),
):
    """List available models — OpenAI-compatible."""
    return await inference_service.list_models()

from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db

@router.post("/v1/chat/completions")
async def chat_completions(
    body: ChatCompletionRequest,
    auth: tuple = Depends(get_api_key_user),
    db: AsyncSession = Depends(get_db),
    x_test_rate_limit_rpm: Optional[int] = Header(None, alias="x-test-rate-limit-rpm")
):
    """Chat completions endpoint — supports streaming via SSE."""
    user, api_key = auth

    # Apply rate limiting
    if x_test_rate_limit_rpm is not None and settings.ENVIRONMENT == "development":
        rpm = max(1, min(x_test_rate_limit_rpm, 1000))
        key_id = f"test:{str(api_key.id) if api_key else str(user.id)}:{rpm}"
    else:
        if api_key:
            rpm = api_key.rate_limit_rpm
        else:
            rpm = settings.DEFAULT_RATE_LIMIT_RPM
            if user.org_id:
                try:
                    from app.modules.orgs import service as org_service
                    org = await org_service.get_org(db, user.org_id)
                    if org.rate_limit_rpm is not None:
                        rpm = org.rate_limit_rpm
                except Exception:
                    pass
            if user.rate_limit_rpm is not None:
                rpm = user.rate_limit_rpm
                
        key_id = str(api_key.id) if api_key else str(user.id)
        
    await rate_limiter.check_rate_limit(key_id, rpm)

    # Extract tracking labels
    user_id_str = str(user.id)
    org_id_str = str(api_key.org_id) if api_key and api_key.org_id else "unknown"

    if body.stream:
        return StreamingResponse(
            inference_service.stream_chat_completion(body, user_id=user_id_str, org_id=org_id_str),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            }
        )
    else:
        return await inference_service.chat_completion(body, user_id=user_id_str, org_id=org_id_str)
