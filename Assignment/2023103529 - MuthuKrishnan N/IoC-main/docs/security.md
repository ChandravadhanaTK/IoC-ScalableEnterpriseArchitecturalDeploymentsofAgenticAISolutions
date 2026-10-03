# Enterprise Security Model & AI Safety Guardrails

## 1. Security Architecture Principles
The platform follows a **Defense-in-Depth** and **Zero Trust** security posture designed specifically for Agentic AI workflows. The system ensures that non-deterministic LLM behavior cannot execute unauthorized financial transactions, bypass compliance rules, or leak cross-tenant information.

---

## 2. Authentication & Role-Based Access Control (RBAC)

### 2.1 Identity Verification
- **JWT (JSON Web Tokens):** Standard RFC 7519 tokens signed with HMAC-SHA256 (`HS256`).
- **Token Claims:** `sub` (User ID), `email`, `role`, and `exp` (12-hour expiry).
- **Password Storage:** One-way hashed using `bcrypt` with salt rounds = 12. Plaintext passwords are never persisted.

### 2.2 Role Matrix

| Resource / Endpoint | `CUSTOMER` | `SUPPORT_AGENT` | `ADMIN` |
| :--- | :---: | :---: | :---: |
| Submit Complaint | Allowed | Allowed | Allowed |
| View Own Complaints | Allowed | Allowed | Allowed |
| View All Complaints | Blocked (403) | Allowed | Allowed |
| View Associated Order | Own Orders Only | Allowed | Allowed |
| Approve / Reject Refund | Blocked (403) | Allowed | Allowed |
| Override Policy Decision | Blocked (403) | Allowed | Allowed |
| View Enterprise Metrics | Blocked (403) | Blocked (403) | Allowed |
| View Security & Audit Logs | Blocked (403) | Blocked (403) | Allowed |

---

## 3. Agentic AI Guardrails & Prompt Injection Defense

### 3.1 Prompt Injection Detection
Adversarial prompts attempting to hijack agent instructions are intercepted before reaching the LLM or tool execution engine.
- **Pattern Matching & Heuristic Heuristics:**
  - Instructions containing phrases like `"ignore previous instructions"`, `"system prompt override"`, `"bypass approval"`, `"act as admin"`, or delimiter breaking patterns (`"---END SYSTEM PROMPT---"`).
- **Action upon Detection:**
  1. Input is flagged as `SECURITY_FLAG_PROMPT_INJECTION`.
  2. Direct automated action execution is immediately revoked.
  3. Case is quarantined and escalated to `HUMAN_REVIEW` with an emergency tag.
  4. An immutable security audit log event is recorded with the offending prompt masked.

### 3.2 Code-Enforced Data Boundaries
- The LLM **never** constructs raw database queries.
- Data retrieval is restricted to strict, registered tools:
  - `get_order_details(order_id)` verifies that the order's `customer_id` matches the session `user_id`.
  - Attempts to access another customer's order return:
    ```json
    {
      "error": "UNAUTHORIZED_ORDER_ACCESS",
      "message": "User CUS-001 is not authorized to inspect order ORD-1002 belonging to CUS-002"
    }
    ```
  - This error is trapped by the Order Agent and recorded in the audit log as a `BLOCKED_TOOL_CALL`.

### 3.3 Strict Tool Whitelisting
- Only pre-registered Python functions can be invoked by the Action Agent.
- Dynamic evaluation (`eval()`, `exec()`, arbitrary shell commands) is completely absent from the codebase.
- Parameter validation is strictly enforced using Pydantic schemas before execution.

---

## 4. Privacy & Data Masking
- **PII Scrubbing:** Credit card numbers, CVVs, and sensitive payment tokens are masked before being passed into LLM prompt contexts or written to the `AuditLog` collection.
- **Log Sanitization:** JWT Bearer tokens and API keys are redacted from standard application logs (`Authorization: Bearer [REDACTED]`).
