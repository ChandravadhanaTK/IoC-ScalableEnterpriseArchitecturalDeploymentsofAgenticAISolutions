# Application Generation Prompt — Scalable Enterprise Agentic AI Assistant

## Objective

Build a scalable enterprise-grade agentic AI assistant based on the following reference implementation:

- Channel: WhatsApp
- Agent gateway/runtime: OpenClaw
- Local model runtime: Ollama
- Reference model: Qwen3:1.7B
- Primary use case: conversational AI assistant with controlled tool execution
- Deployment starting point: local development on Windows
- Target: production-ready, secure and scalable enterprise architecture

The application must be designed around the five capstone deliverables:

1. Architecture Diagram
2. Agent Workflow Design
3. Deployment Strategy
4. Security Model
5. Monitoring Dashboard Design

## Functional Requirements

### 1. WhatsApp Channel

Implement a WhatsApp channel adapter that:

- Receives inbound messages.
- Validates the sender against an allowlist/identity policy.
- Associates the sender with a stable application session.
- Sends the final assistant response back to WhatsApp.
- Handles reconnects and outbound delivery failures.
- Uses message IDs/idempotency keys to avoid duplicate processing.

### 2. Agent Runtime

Implement an agent orchestration layer that:

- Receives normalized user requests.
- Loads the correct session.
- Builds the model context.
- Invokes the configured model.
- Determines whether the request needs a direct answer or a tool.
- Never treats arbitrary model-generated JSON as executable authority.
- Routes tool requests through a separate authorization layer.
- Produces a final user-facing response.

Use explicit workflow states:

`RECEIVED -> VALIDATING -> CONTEXT_BUILDING -> MODEL_INFERENCE -> TOOL_AUTHORIZING -> TOOL_EXECUTING -> RESULT_VALIDATING -> RESPONSE_GENERATING -> DELIVERING -> COMPLETED`

Also support a controlled `FAILED` state.

### 3. Model Layer

Integrate Ollama through a provider abstraction.

The reference configuration is:

- Provider: Ollama
- Model: `qwen3:1.7b`
- Context: approximately 16K tokens

The implementation must validate model output before interpreting structured actions.

Important requirement:

**If the model outputs text resembling a tool call, such as JSON containing `name`, `arguments` or `tool_call`, do not automatically execute it.**

Only a validated structured tool invocation produced through the supported model/tool interface may enter the tool gateway.

### 4. Tool Gateway

Create a separate tool gateway.

Every tool request must pass:

1. Tool-name allowlist validation.
2. Input schema validation.
3. User authorization.
4. Policy/guardrail checks.
5. Rate-limit checks.
6. Execution timeout.
7. Result validation.
8. Audit logging.

Never allow the model to execute arbitrary shell commands, arbitrary code or arbitrary URLs.

Create at least two example safe tools, such as:

- Calculator
- Current system health/status

The tools must have explicit schemas.

### 5. Session Management

Provide:

- Stable session IDs.
- Session creation.
- Session lookup.
- Session reset.
- Context compaction.
- Session TTL/retention policy.
- Protection against unbounded context growth.

Use a storage abstraction so SQLite can be used for development and PostgreSQL/Redis can be used for production.

### 6. Security

Implement:

- Channel-level identity checks.
- Role/capability-based authorization.
- Secrets through environment variables or a secrets manager.
- Input validation.
- Output validation.
- Tool allowlisting.
- Prompt-injection defenses.
- Sensitive-data redaction.
- Audit events.

The LLM must never be treated as a trusted security boundary.

### 7. Observability

Every request must have a correlation ID.

Record:

- Request received.
- Session lookup.
- Model request/response.
- Tool authorization.
- Tool execution.
- Final response generation.
- WhatsApp delivery.
- Errors and latency.

Expose metrics for:

- Request rate.
- Success rate.
- P50/P95/P99 latency.
- Model latency.
- Tool success/failure rate.
- Invalid tool-call rate.
- WhatsApp connection state.
- CPU/GPU/memory utilization.
- Active sessions.
- Error count.
- Safety events.

Build a monitoring dashboard with sections for:

- Health
- Trace
- Quality
- Safety
- Resource/cost
- Business outcomes

### 8. Resilience

Implement:

- Timeouts.
- Bounded retries.
- Exponential backoff.
- Circuit breakers for external dependencies.
- Graceful degradation.
- Idempotency.
- Dead-letter handling for asynchronous jobs.
- Health checks.

Do not retry non-idempotent actions blindly.

### 9. Deployment

Provide two deployment modes.

#### Development

```text
Windows
  -> OpenClaw Gateway
  -> Ollama
  -> Qwen3:1.7B
  -> SQLite
  -> WhatsApp
```

#### Production

```text
WhatsApp
   -> Secure Edge
   -> Load Balancer
   -> Agent Gateway Pool
   -> Model Worker Pool
   -> Tool Gateway
   -> Enterprise APIs
   -> PostgreSQL / Redis
   -> Observability Platform
```

Use separate Development, Test, Staging and Production environments.

### 10. UI / Dashboard

Create a professional enterprise dashboard showing:

- Gateway health
- WhatsApp status
- Model status
- Request rate
- Success rate
- Latency
- Tool calls
- Failed calls
- Safety events
- Resource utilization
- Recent traces
- Business outcomes

Use a clean enterprise design and make the dashboard usable on desktop screens.

## Architecture Deliverables

Generate the following documentation alongside the application:

### Architecture Diagram

Show:

- User/channel
- Gateway
- Agent orchestrator
- Model service
- Tool gateway
- Enterprise integrations
- Data stores
- Observability
- Trust boundaries

### Agent Workflow Design

Show:

- Roles
- States
- Tool calls
- Approvals
- Handoffs
- Failure paths
- Retry behavior

### Deployment Strategy

Document:

- Runtime
- Scaling
- Resilience
- Environment separation
- Release strategy

### Security Model

Document:

- Identity
- Authorization
- Secrets
- Privacy
- Guardrails
- Audit

### Monitoring Dashboard

Document and implement metrics for:

- Health
- Trace
- Quality
- Safety
- Resource/cost
- Business outcomes

## Quality Requirements

- Use modular architecture.
- Keep channel, agent, model, tool, data and observability components loosely coupled.
- Use clear interfaces between services.
- Add validation and error handling.
- Add structured logging.
- Add tests for normal and failure paths.
- Do not hard-code secrets.
- Do not execute arbitrary model-generated commands.
- Make configuration environment-driven.
- Provide a README with setup and deployment instructions.
- Clearly distinguish prototype-only components from production components.

## Expected Project Structure

```text
agentic-ai-assistant/
├── README.md
├── .env.example
├── docker-compose.yml
├── docs/
│   ├── architecture.md
│   ├── agent-workflow.md
│   ├── deployment.md
│   ├── security.md
│   └── monitoring.md
├── src/
│   ├── channel/
│   ├── agent/
│   ├── model/
│   ├── tools/
│   ├── policy/
│   ├── session/
│   ├── integrations/
│   └── observability/
├── tests/
└── dashboard/
```

## Final Instruction

Generate the application as a coherent enterprise architecture rather than a collection of disconnected features. Prioritize safe tool execution, explicit authorization, observable workflows, session control, resilience and scalability.
