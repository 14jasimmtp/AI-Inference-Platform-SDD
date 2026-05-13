# Research: Initial Inference Layer

## Decision: Model Performance Baseline
- **Finding**: `llama3.2:3b-instruct-q4_K_M` (GGUF) performs excellently on CPU-only systems with 8GB RAM.
- **Expected Metrics**: 7-10+ tokens/sec generation speed; TTFT < 3s.
- **Resource Usage**: ~2.0-3.5 GB RAM usage for the model, leaving ~4GB+ for OS and containers.
- **Recommendation**: Set `num_ctx=2048` in Ollama to maintain stable memory usage.

## Decision: SSE Streaming Implementation
- **Finding**: FastAPI's `StreamingResponse` combined with `httpx.AsyncClient` is the standard for proxying SSE.
- **Pattern**:
  ```python
  async def event_generator():
      async with httpx.AsyncClient() as client:
          async with client.stream("POST", url, json=payload) as response:
              async for line in response.aiter_lines():
                  if line: yield f"data: {line}\n\n"
  return StreamingResponse(event_generator(), media_type="text/event-stream")
  ```
- **Rationale**: Efficiently pipes tokens from Ollama to the client without buffering the full response.

## Decision: Standalone Registration (No Org)
- **Finding**: The constitution requires an `org_id` on all users, but the spec defers org management.
- **Decision**: Keep `org_id` in the `users` table as a **NULLABLE** foreign key.
- **Rationale**: Ensures the database schema is forward-compatible with the future multi-tenancy feature without breaking the current "standalone" registration flow.
- **Implication**: Any logic checking for `org_id` in this layer must handle `None` gracefully.

## Decision: Multi-turn Context Handling
- **Finding**: Llama 3.2 3B handles context well but has an 8k window (quantized).
- **Decision**: Frontend will maintain a `messages` array in Zustand and send the full array with each `POST /v1/chat/completions` request.
- **Rationale**: Simple implementation for initial layer that leverages the model's instruction-following capabilities.
- **Limit**: UI will truncate or alert if the total token count approaches the 2048 context window limit set in the constitution.
