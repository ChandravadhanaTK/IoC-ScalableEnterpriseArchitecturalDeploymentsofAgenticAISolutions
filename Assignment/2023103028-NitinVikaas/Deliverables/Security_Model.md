# 4. Security Model

## 4.1 Identity

Production authentication should be handled by the backend. The frontend may display role-specific experiences, but client-side role selection is not authorization.

The documented API includes authentication and current-user endpoints.

## 4.2 Authorization

Use server-side RBAC/ABAC for:

- learner actions
- mentor/cohort functions
- administrator configuration
- guardrail configuration
- content editing
- audit-log access

Never rely on hidden buttons or frontend route guards as the only authorization mechanism.

## 4.3 Secrets

The project includes `.env.example`.

Rules:

- never commit `.env`
- never place service credentials in `VITE_*` variables
- keep LLM/API/database credentials on the server
- rotate compromised credentials
- use managed secret storage in production

## 4.4 Input Validation

Validate:

- request body
- query parameters
- route parameters
- challenge submissions
- agent tool arguments
- external API responses

The application uses Zod at the frontend schema boundary and defines a formal OpenAPI backend contract.

## 4.5 Code Execution Security

The browser Python lab uses Pyodide/Web Worker execution for the demonstration.

A production backend must not execute arbitrary learner code inside the main API process. Use a sandboxed execution environment with:

- CPU limits
- memory limits
- execution timeout
- filesystem restrictions
- network restrictions
- process/container isolation
- resource quotas

## 4.6 AI Guardrails

Agentic operations should enforce:

- tool allowlists
- schema validation
- prompt/context boundaries
- output validation
- rate limiting
- sensitive-data controls
- approval for high-impact actions
- audit logging

LLM-generated content must be treated as untrusted output.

## 4.7 Privacy

Minimize stored learner data. Store only information required for:

- account identity
- progress
- challenge results
- required audit/security events

Avoid storing secrets or unnecessary personal information.

---
