# Inference Contract

## POST /api/v1/chat/completions
OpenAI-compatible chat completion endpoint.

### Request (Non-Streaming)
```json
{
  "model": "llama3.2:3b-instruct-q4_K_M",
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "Tell me a joke." }
  ],
  "stream": false,
  "temperature": 0.7
}
```

### Response (200 OK)
```json
{
  "id": "chatcmpl-uuid",
  "object": "chat.completion",
  "created": 1746612000,
  "model": "llama3.2:3b-instruct-q4_K_M",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Why did the AI cross the road? To get to the other side of the algorithm!"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 20,
    "completion_tokens": 15,
    "total_tokens": 35
  }
}
```

### Request (Streaming)
Set `"stream": true` in the request body.

### Response (200 OK)
`Content-Type: text/event-stream`

```
data: {"id":"chatcmpl-uuid","choices":[{"delta":{"content":"Why"},"index":0}]}
data: {"id":"chatcmpl-uuid","choices":[{"delta":{"content":" did"},"index":0}]}
...
data: [DONE]
```

## GET /api/v1/models
Lists available models.

### Response (200 OK)
```json
{
  "object": "list",
  "data": [
    {
      "id": "llama3.2:3b-instruct-q4_K_M",
      "object": "model",
      "display_name": "Llama 3.2 3B Instruct",
      "quantization": "Q4_K_M",
      "context_window": 2048
    }
  ]
}
```
