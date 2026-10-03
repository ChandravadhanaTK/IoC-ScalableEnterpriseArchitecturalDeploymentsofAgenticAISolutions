# Security Model

ResolveAI assumes messages and LLM-adjacent outputs are untrusted. The backend—not an agent—is the policy enforcement point.

| Threat/control | Design response |
|---|---|
| Stolen session | Short-lived signed JWT, HTTPS-only deployment, rotation/revocation strategy in production |
| Privilege misuse | RBAC (`customer`, `support_agent`, `approver`, `admin`) and server-side route enforcement |
| Customer data leak | Customer ID is bound from JWT and passed to the order adapter; caller-supplied customer IDs do not exist |
| Prompt injection | Known instruction-override markers are escalated; retrieved context is never treated as executable instructions |
| Unauthorised reimbursement | Resolution nodes only propose; approval endpoint needs `approver` or `admin` JWT |
| Invalid input | Pydantic message/order constraints, null rejection, safe error responses |
| Secret leak | Environment variable configuration, `.env.example` without values, secret manager in production |
| Weak accountability | Timestamped structured audit events for login, tools, ticket creation, and approvals |

## Data handling rules

Only data required to resolve a ticket is retrieved. Production logs must redact tokens, credentials, addresses, card data, and free-text fields where possible. Define ticket/audit retention periods, encryption at rest, transport encryption, data-subject deletion processes, and approval-review access controls before processing real customer records.

## Security test evidence

`tests/test_api.py` verifies an ordinary customer can create an eligible request, cannot view a fictitious peer's ticket, and cannot invoke the approval endpoint. The approval route is tested with the manager role.
