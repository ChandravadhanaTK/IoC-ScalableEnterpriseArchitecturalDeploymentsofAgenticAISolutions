# Artifact 4: Enterprise Security Model & Governance Architecture

## 1. Security Architecture Principles
NextStep implements a **Zero Trust Security Model** across all layers of user interaction, agent orchestration, and persistence. All identity claims are authenticated via cryptographically signed tokens, privileges are enforced at the API route level, and multi-tenant student data is strictly segregated.

---

## 2. Authentication & Identity Architecture

```
User (Browser)               API Gateway (FastAPI)           Auth Provider (BCrypt + JWT)
     │                                │                                   │
     ├── POST /api/auth/login ───────►│                                   │
     │   { email, password }          ├── Verify Password Hash ──────────►│
     │                                │   bcrypt.checkpw(secret, salt)    │
     │                                │◄── Hash Valid ────────────────────┤
     │                                │                                   │
     │                                ├── Generate Access Token ─────────►│
     │                                │   Payload: { sub, role, exp }     │
     │                                │◄── Signed Token (HS256) ──────────┤
     │◄── Set Auth Header ────────────┤
     │    Bearer <JWT_TOKEN>          │
```

### Password Hashing Standards
- Uses industry-standard `bcrypt` key derivation with automated cryptographic salt generation.
- Defense against length-extension vulnerabilities: Passwords encoded to UTF-8 and truncated to 72 bytes before hashing.
- Plaintext passwords are never logged, persisted, or stored in memory after hash verification.

### JWT Bearer Token Specification
- Algorithm: `HS256` (HMAC SHA-256)
- Expiration: Configurable via `ACCESS_TOKEN_EXPIRE_MINUTES` (Default: 7 days)
- Standard Claims:
  - `sub`: User UUID (Immutable subject identifier)
  - `role`: Role claim (`student` | `admin`)
  - `exp`: Expiration timestamp in UTC

---

## 3. Role-Based Access Control (RBAC) Matrix

| Resource / Endpoint | Method | Student Access | Admin Access | Enforcement Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| `/api/auth/login` | POST | Anonymous | Anonymous | Public endpoint |
| `/api/auth/register` | POST | Anonymous | Gated by Secret | Admin creation requires `admin_secret` |
| `/api/auth/me` | GET | Own Profile | Own Profile | Dependency: `get_current_user` |
| `/api/goals` | GET / POST | Own Goals Only | Own Goals Only | Scoped: `Goal.user_id == current_user.id` |
| `/api/goals/{id}` | GET / DELETE | Own Goals Only | Own Goals Only | Scoped: `Goal.user_id == current_user.id` |
| `/api/agent/dashboard` | GET | Own Dashboard | Own Dashboard | Scoped to authenticated user session |
| `/api/agent/goals/{id}/action` | POST | Own Goals Only | Own Goals Only | Ownership validation check before action |
| `/api/admin/monitoring` | GET | **403 FORBIDDEN** | **AUTHORIZED** | Dependency: `require_admin` |
| `/api/admin/users` | GET | **403 FORBIDDEN** | **AUTHORIZED** | Dependency: `require_admin` |
| `/api/admin/users/{id}/toggle-active` | PATCH | **403 FORBIDDEN** | **AUTHORIZED** | Dependency: `require_admin` |
| `/api/admin/audit-logs` | GET | **403 FORBIDDEN** | **AUTHORIZED** | Dependency: `require_admin` |
| `/api/admin/goals` | GET | **403 FORBIDDEN** | **AUTHORIZED** | Dependency: `require_admin` |

---

## 4. Student Data Isolation & Privacy Guarantee
In shared educational software, data leakage between students is a severe compliance violation. NextStep guarantees complete multi-tenant tenant isolation:
1. **No Shared Query State**: Every query targeting `Goal`, `Task`, `Milestone`, or `AgentState` includes an explicit filter: `Goal.user_id == current_user.id`.
2. **Path Traversal Protection**: When a student requests `/api/goals/{goal_id}`, the query validates that the goal belongs to the requesting `user_id`. Attempting to access another user's goal ID produces `404 Not Found`, preventing identifier enumeration.
3. **No Unauthenticated Leaks**: Any token mismatch or expired signature raises immediate `401 Unauthorized` and flushes client-side state.

---

## 5. Agentic AI Safety & Prompt Injection Guardrails

```
+-----------------------------------------------------------------------------------+
|                           INPUT SANITIZATION LAYER                                |
|  - Student prompts stripped of markdown injection fences and raw script tags      |
|  - Character limits enforced (Title <= 300 chars, Description <= 2000 chars)      |
+-----------------------------------------|-----------------------------------------+
                                          |
+-----------------------------------------v-----------------------------------------+
|                        STRUCTURED GENERATION BOUNDARY                             |
|  - LLM instructions enforce strict JSON Schemas (Pydantic models)                 |
|  - Conversational rambling or instructions to bypass safety guidelines rejected   |
+-----------------------------------------|-----------------------------------------+
                                          |
+-----------------------------------------v-----------------------------------------+
|                         OUTPUT VALIDATION & TYPE DEFENSE                          |
|  - Regex stripping of stray fences                                                |
|  - Schema parsing: validates milestones array, tasks array, order indices         |
|  - Validation failure automatically triggers clean fallback deterministic plan    |
+-----------------------------------------------------------------------------------+
```

---

## 6. Audit Logging & Security Event Forensics

All administrative actions, security failures, and agent lifecycle transitions are logged to the `audit_logs` table:

```sql
CREATE TABLE audit_logs (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR,
    details JSON,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Monitored Security Events:
- `user_registered`: Account creation with assigned role.
- `user_status_toggled`: Admin disabling or enabling a student account.
- `unauthorized_admin_access_attempt`: Triggered when non-admin accesses `/api/admin/*`.
- `goal_deleted`: Deletion of learning roadmaps for audit reconciliation.
