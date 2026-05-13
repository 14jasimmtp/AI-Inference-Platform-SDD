import logging
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.schemas.inference import ChatCompletionRequest, ChatCompletionResponse, ModelListResponse
from app.services.inference_service import inference_service
from app.dependencies import get_api_key_user
from app.models.user import User
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

@router.post("/v1/chat/completions")
async def chat_completions(
    body: ChatCompletionRequest,
    auth: tuple = Depends(get_api_key_user),
):
    """Chat completions endpoint — supports streaming via SSE."""
    user, api_key = auth

    # Apply rate limiting
    rpm = api_key.rate_limit_rpm if api_key else settings.DEFAULT_RATE_LIMIT_RPM
    key_id = str(api_key.id) if api_key else str(user.id)
    await rate_limiter.check_rate_limit(key_id, rpm)

    if body.stream:
        return StreamingResponse(
            inference_service.stream_chat_completion(body),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            }
        )
    else:
        return await inference_service.chat_completion(body)
