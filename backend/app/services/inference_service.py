import uuid
import time
import logging
from typing import AsyncGenerator
import httpx
from app.config import settings
from app.schemas.inference import (
    ChatCompletionRequest, ChatCompletionResponse,
    ChatCompletionChoice, ChatCompletionUsage, ChatMessage,
    ModelListResponse, ModelInfo,
)
from app.exceptions import InferenceUnavailableError

logger = logging.getLogger(__name__)

class InferenceService:
    def __init__(self):
        self.ollama_url = settings.OLLAMA_BASE_URL
        self.client = httpx.AsyncClient(timeout=300.0)

    async def list_models(self) -> ModelListResponse:
        try:
            resp = await self.client.get(f"{self.ollama_url}/api/tags")
            resp.raise_for_status()
            data = resp.json()
            models = [
                ModelInfo(id=m["name"], owned_by="local")
                for m in data.get("models", [])
            ]
            return ModelListResponse(data=models)
        except httpx.ConnectError:
            raise InferenceUnavailableError("Ollama service is unavailable")
        except Exception as e:
            logger.error("Failed to list models", extra={"error": str(e)})
            raise InferenceUnavailableError("Failed to retrieve models from Ollama")

    async def chat_completion(
        self, request: ChatCompletionRequest
    ) -> ChatCompletionResponse:
        """Non-streaming chat completion."""
        start_time = time.time()
        payload = {
            "model": request.model,
            "messages": [m.model_dump() for m in request.messages],
            "stream": False,
            "keep_alive": -1,
            "options": {
                "temperature": request.temperature,
                "num_ctx": 2048,
            }
        }
        if request.max_tokens:
            payload["options"]["num_predict"] = request.max_tokens

        try:
            resp = await self.client.post(
                f"{self.ollama_url}/api/chat",
                json=payload,
            )
            resp.raise_for_status()
        except httpx.ConnectError:
            raise InferenceUnavailableError("Ollama service is unavailable")
        except httpx.HTTPStatusError as e:
            logger.error("Ollama returned error", extra={"status": e.response.status_code})
            raise InferenceUnavailableError(f"Ollama error: {e.response.status_code}")

        data = resp.json()
        duration_ms = (time.time() - start_time) * 1000
        logger.info(
            "Inference complete",
            extra={"model": request.model, "duration_ms": round(duration_ms, 2)}
        )

        return ChatCompletionResponse(
            id=f"chatcmpl-{uuid.uuid4().hex[:8]}",
            model=request.model,
            choices=[
                ChatCompletionChoice(
                    index=0,
                    message=ChatMessage(
                        role="assistant",
                        content=data["message"]["content"]
                    ),
                    finish_reason=data.get("done_reason", "stop"),
                )
            ],
            usage=ChatCompletionUsage(
                prompt_tokens=data.get("prompt_eval_count", 0),
                completion_tokens=data.get("eval_count", 0),
                total_tokens=data.get("prompt_eval_count", 0) + data.get("eval_count", 0),
            ),
        )

    async def stream_chat_completion(
        self, request: ChatCompletionRequest
    ) -> AsyncGenerator[str, None]:
        """SSE streaming chat completion — yields data: ... lines."""
        import json
        payload = {
            "model": request.model,
            "messages": [m.model_dump() for m in request.messages],
            "stream": True,
            "keep_alive": -1,
            "options": {
                "temperature": request.temperature,
                "num_ctx": 2048,
            }
        }
        if request.max_tokens:
            payload["options"]["num_predict"] = request.max_tokens

        completion_id = f"chatcmpl-{uuid.uuid4().hex[:8]}"
        try:
            async with self.client.stream(
                "POST",
                f"{self.ollama_url}/api/chat",
                json=payload,
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line:
                        continue
                    try:
                        chunk = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    content = chunk.get("message", {}).get("content", "")
                    done = chunk.get("done", False)

                    sse_data = {
                        "id": completion_id,
                        "object": "chat.completion.chunk",
                        "model": request.model,
                        "choices": [{
                            "index": 0,
                            "delta": {"role": "assistant", "content": content},
                            "finish_reason": chunk.get("done_reason") if done else None,
                        }]
                    }
                    yield f"data: {json.dumps(sse_data)}\n\n"
                    if done:
                        break
        except httpx.ConnectError:
            raise InferenceUnavailableError("Ollama service is unavailable")

        yield "data: [DONE]\n\n"

inference_service = InferenceService()
