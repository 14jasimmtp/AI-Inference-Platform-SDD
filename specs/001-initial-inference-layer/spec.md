# Feature Specification: Initial Inference Layer

**Feature Branch**: `001-initial-inference-layer`
**Created**: 2026-05-13
**Status**: Draft
**Input**: User description: "This AI inference layer should have APIs to call the model, receive responses, and a UI for chats."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Send a Chat Message and Receive a Response (Priority: P1)

A user opens the chat UI, types a message, and receives an AI-generated response from the locally-hosted quantised LLM. The system proxies the request through the backend API to the Ollama inference engine and streams or returns the full completion back to the user in real time.

**Why this priority**: This is the fundamental capability of the entire platform. Without the ability to send a prompt and receive a completion, no other feature has value. It validates the end-to-end inference pipeline from UI → API → Ollama → response.

**Independent Test**: Can be fully tested by opening the chat UI, typing "Hello", and verifying an AI-generated response appears. Delivers immediate value as a working AI chat interface.

**Acceptance Scenarios**:

1. **Given** a user is on the chat page with a valid session, **When** they type a message and press Send, **Then** the system sends the message to the backend API and displays the AI-generated response in the chat thread within an acceptable latency window.
2. **Given** a user sends a message with `stream: true`, **When** the backend begins receiving tokens from the inference engine, **Then** tokens appear incrementally in the chat UI as they arrive (server-sent events).
3. **Given** a user sends a message with `stream: false`, **When** the inference engine completes the response, **Then** the full response is displayed at once in the chat thread.
4. **Given** the inference engine is unavailable or the model is not loaded, **When** a user sends a message, **Then** the system displays a clear, user-friendly error message indicating the service is temporarily unavailable.

---

### User Story 2 - Authenticate and Manage a Chat Session (Priority: P2)

A user registers or logs in, receives a session token, and can maintain a persistent identity across chat interactions. The system issues API keys that the chat UI uses internally to authenticate inference requests.

**Why this priority**: Authentication is required so that chat requests can be attributed to a user and rate-limited per API key. Without auth, the inference endpoint would be open and uncontrolled.

**Independent Test**: Can be tested by registering a new user, logging in, verifying a JWT is returned, then using the session to send an inference request. Delivers value as a secured, identity-aware chat system.

**Acceptance Scenarios**:

1. **Given** a new user, **When** they submit the registration form with valid credentials, **Then** the system creates their account and returns them to the login screen with a success message.
2. **Given** a registered user, **When** they submit valid login credentials, **Then** the system returns a session token and redirects them to the chat page.
3. **Given** an authenticated user, **When** they send a chat message, **Then** the request is authenticated via their session and attributed to their user profile.
4. **Given** an unauthenticated user, **When** they attempt to access the chat page, **Then** they are redirected to the login screen.

---

### User Story 3 - View Available Models and Chat History (Priority: P3)

An authenticated user can see which AI model is currently active, view a list of available models, and review their previous chat interactions within the current session.

**Why this priority**: This provides contextual awareness (which model am I talking to?) and session continuity (what did I ask before?). It enhances usability but is not required for the core chat functionality.

**Independent Test**: Can be tested by logging in, verifying the active model name is displayed, sending several messages, and confirming the chat history persists within the session. Delivers value as a richer, more informative chat experience.

**Acceptance Scenarios**:

1. **Given** an authenticated user on the chat page, **When** the page loads, **Then** the currently active model name and key details (quantisation, context window) are displayed.
2. **Given** an authenticated user who has sent multiple messages, **When** they scroll up in the chat thread, **Then** all previous messages and responses from the current session are visible.
3. **Given** multiple models are registered in the system, **When** the user views the model information area, **Then** they see a list of available models with the active one highlighted.

---

### Edge Cases

- What happens when the user sends an empty message? The system should reject it with a validation error before reaching the inference engine.
- What happens when the inference engine times out mid-stream? The system should close the SSE connection gracefully and display a partial-response indicator or error to the user.
- What happens when the user sends a message that exceeds the model's context window? The system should return a clear error indicating the message is too long.
- What happens when the user's API key is rate-limited? The system should display a "too many requests" message with a retry countdown.
- What happens when the user's session token expires mid-conversation? The system should prompt the user to re-authenticate without losing their visible chat history.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST expose an inference API endpoint compatible with the OpenAI chat completions schema (`POST /v1/chat/completions`).
- **FR-002**: System MUST support both streaming (SSE) and non-streaming response modes for inference requests.
- **FR-003**: System MUST proxy inference requests to the locally-running Ollama engine and translate responses to OpenAI-compatible format.
- **FR-004**: System MUST provide user registration and login functionality with session-based authentication.
- **FR-005**: System MUST issue API keys to authenticated users for inference request authentication.
- **FR-006**: System MUST rate-limit inference requests per API key using a token bucket algorithm.
- **FR-007**: System MUST provide a web-based chat UI where users can type messages and view AI responses.
- **FR-008**: System MUST display streaming responses incrementally in the chat UI as tokens arrive.
- **FR-009**: System MUST provide a model listing endpoint (`GET /v1/models`) returning available models and their status.
- **FR-010**: System MUST display the currently active model information in the chat UI.
- **FR-011**: System MUST maintain in-session chat history so users can scroll through previous messages.
- **FR-012**: System MUST return structured error responses for all failure conditions (auth failure, rate limiting, engine unavailable, validation errors).
- **FR-013**: System MUST log all inference requests with token counts and latency metrics for usage tracking.
- **FR-014**: System MUST provide a health check endpoint (`GET /health`) reporting the status of the inference engine, database, and overall system uptime.
- **FR-015**: System MUST send the full session conversation history (all prior user and assistant messages) with each inference request to enable multi-turn, context-aware replies.
- **FR-016**: System MUST prepend a default system prompt (e.g., "You are a helpful assistant.") to every inference request. The system prompt is hardcoded in the backend and not user-configurable in this initial feature.

### Key Entities

- **User**: A person who registers, logs in, and interacts with the chat UI. Has an email, name, and role. Organisation assignment is deferred to a future feature.
- **API Key**: A credential issued to a user for authenticating inference requests. Stored as a hash; plaintext shown once at creation.
- **Chat Message**: A single user prompt or AI response within a conversation session. Contains role (user/assistant/system), content, and timestamp. The full ordered sequence of messages forms the conversation context sent with each new request.
- **Model**: An AI model available for inference. Has an identifier, display name, quantisation type, resource requirements, and active/loaded status.
- **Usage Log**: A record of each inference request capturing token counts, latency, status, and the associated user/key.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can send a chat message and receive an AI response within 10 seconds for a typical prompt (under 200 tokens).
- **SC-002**: Streaming responses display the first token in the chat UI within 3 seconds of sending the message.
- **SC-003**: 95% of authenticated users can complete the login-to-first-message flow in under 60 seconds.
- **SC-004**: The system handles at least 5 concurrent chat sessions without degradation in response quality or significant latency increase.
- **SC-005**: All error conditions (auth failure, rate limiting, engine down) display user-friendly messages within 2 seconds.
- **SC-006**: The chat UI renders correctly on desktop browsers (Chrome, Firefox, Edge) at viewport widths of 1024px and above.
- **SC-007**: Users can review their in-session chat history by scrolling, with all messages rendered correctly including code blocks and formatting.

## Assumptions

- Users have a stable local network connection to the host running the platform (this is an internal/local deployment, not a public cloud service).
- The Ollama inference engine is pre-installed and running as a host-native process on port 11434 before the platform starts.
- A single quantised GGUF model (e.g., `llama3.2:3b-instruct-q4_K_M`) is pre-pulled and loaded in Ollama.
- The host machine has at least 8 GB RAM, with approximately 2.4 GB reserved for the inference engine.
- User registration is open (any user can self-register); there is no organisation concept in this initial feature — org assignment, multi-tenancy, and advanced role management are handled in a subsequent feature.
- Chat history is session-scoped (in-memory or client-side) for this initial layer; persistent server-side conversation storage is a future enhancement.
- The chat UI is a single-page web application accessed via desktop browsers; mobile optimisation is out of scope for this initial feature.
- The system prompt is a hardcoded default in the backend; user-editable or admin-configurable system prompts are a future enhancement.

## Clarifications

### Session 2026-05-13

- Q: How are users assigned to an organisation during open registration? → A: Organisation is out of scope for this feature; users register standalone. Org support deferred to a future feature.
- Q: Should the chat send full conversation history or treat each message independently? → A: Full session history sent with each request (multi-turn, context-aware replies).
- Q: Should the system prompt be user-configurable or hardcoded? → A: Default system prompt hardcoded in the backend; not user-visible or configurable in this initial feature.
