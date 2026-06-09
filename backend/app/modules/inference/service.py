import uuid
import time
import logging
from typing import AsyncGenerator
import httpx
from app.config import settings
from app.modules.inference.schemas import (
    ChatCompletionRequest, ChatCompletionResponse,
    ChatCompletionChoice, ChatCompletionUsage, ChatMessage,
    ModelListResponse, ModelInfo,
)
from app.exceptions import InferenceUnavailableError
from app.core.metrics import (
    inference_requests_total,
    inference_duration_seconds,
    inference_tokens_total,
)

logger = logging.getLogger(__name__)

ALLOWED_MODELS = {"llama3.2:3b-instruct-q4_K_M", "gemma2:2b-instruct-q4_K_M"}

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
                for m in data.get("models", []) if m["name"] in ALLOWED_MODELS
            ]
            return ModelListResponse(data=models)
        except httpx.ConnectError:
            raise InferenceUnavailableError("Ollama service is unavailable")
        except Exception as e:
            logger.error("Failed to list models", extra={"error": str(e)})
            raise InferenceUnavailableError("Failed to retrieve models from Ollama")

    async def chat_completion(
        self, request: ChatCompletionRequest, user_id: str = "unknown", org_id: str = "unknown"
    ) -> ChatCompletionResponse:
        """Non-streaming chat completion."""
        if request.model not in ALLOWED_MODELS:
            raise InferenceUnavailableError(f"Model {request.model} is not allowed")
            
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
        prompt_tokens = data.get("prompt_eval_count", 0)
        completion_tokens = data.get("eval_count", 0)

        # Record Prometheus metrics
        inference_requests_total.labels(
            model=request.model, status="success", user_id=user_id, org_id=org_id
        ).inc()
        inference_duration_seconds.labels(
            model=request.model, user_id=user_id, org_id=org_id
        ).observe((time.time() - start_time))
        inference_tokens_total.labels(
            model=request.model, type="prompt", user_id=user_id, org_id=org_id
        ).inc(prompt_tokens)
        inference_tokens_total.labels(
            model=request.model, type="completion", user_id=user_id, org_id=org_id
        ).inc(completion_tokens)

        logger.info(
            "Inference complete",
            extra={
                "model": request.model,
                "duration_ms": round(duration_ms, 2),
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "user_id": user_id,
                "org_id": org_id,
            }
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
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=prompt_tokens + completion_tokens,
            ),
        )

    async def stream_chat_completion(
        self, request: ChatCompletionRequest, user_id: str = "unknown", org_id: str = "unknown"
    ) -> AsyncGenerator[str, None]:
        """SSE streaming chat completion — yields data: ... lines."""
        if request.model not in ALLOWED_MODELS:
            raise InferenceUnavailableError(f"Model {request.model} is not allowed")
            
        import json
        start_time = time.time()
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
                        # Stream finished, record metrics
                        prompt_tokens = chunk.get("prompt_eval_count", 0)
                        completion_tokens = chunk.get("eval_count", 0)
                        duration = time.time() - start_time
                        
                        inference_requests_total.labels(
                            model=request.model, status="success", user_id=user_id, org_id=org_id
                        ).inc()
                        inference_duration_seconds.labels(
                            model=request.model, user_id=user_id, org_id=org_id
                        ).observe(duration)
                        inference_tokens_total.labels(
                            model=request.model, type="prompt", user_id=user_id, org_id=org_id
                        ).inc(prompt_tokens)
                        inference_tokens_total.labels(
                            model=request.model, type="completion", user_id=user_id, org_id=org_id
                        ).inc(completion_tokens)
                        
                        logger.info(
                            "Stream inference complete",
                            extra={
                                "model": request.model,
                                "duration_ms": round(duration * 1000, 2),
                                "prompt_tokens": prompt_tokens,
                                "completion_tokens": completion_tokens,
                                "user_id": user_id,
                                "org_id": org_id,
                            }
                        )
                        break
        except httpx.ConnectError:
            raise InferenceUnavailableError("Ollama service is unavailable")

        yield "data: [DONE]\n\n"

inference_service = InferenceService()
