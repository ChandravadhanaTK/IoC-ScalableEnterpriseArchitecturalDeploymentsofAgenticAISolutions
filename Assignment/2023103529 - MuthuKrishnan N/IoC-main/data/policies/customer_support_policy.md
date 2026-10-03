# Enterprise Customer Support & Escalation Policy

**Policy Document ID:** POL-CSP-2026-v3  
**Effective Date:** January 1, 2026  
**Applicability:** Customer Care Operations, Agent Guardrails, and Human-in-the-Loop Governance

---

## 1. Operating Principles & Response SLA
- The platform operates 24/7 autonomous Tier-1 complaint ingestion and triage.
- Complaints classified as `HIGH` priority or involving VIP accounts are guaranteed agent engagement within **2 business hours**.
- Standard priority issues are targeted for resolution within **24 hours**.

---

## 2. Human-in-the-Loop (HITL) Governance & Guardrails
Autonomous AI agents are restricted by enterprise safety boundaries:
1. **Financial Authorization Ceiling:** Any refund exceeding **₹5,000** must be held in `AWAITING_APPROVAL` status and forwarded to an authorized Support Agent.
2. **Ambiguous or Incomplete Inquiries:** If a complaint does not specify an Order ID or necessary claim evidence, the agent must not assume or guess. The agent transitions to `REQUEST_MORE_INFORMATION` or creates an inquiry ticket.
3. **Prompt Injection & Adversarial Attempts:** Any attempt to override policy instructions, dump internal prompts, or trigger unverified financial credits is immediately quarantined, logged as a security event, and escalated to Human Support.
4. **Cross-Customer Data Protection:** Agents must enforce strict tenant/customer boundaries. Customer `A` is strictly prohibited from accessing details or statuses of orders belonging to Customer `B`.

---

## 3. Support Agent Actions and Permissions
- Authorized support agents can:
  - Approve pending refund/replacement recommendations (`POST /api/approvals/{id}/approve`).
  - Reject recommendations with specific reason codes (`POST /api/approvals/{id}/reject`).
  - Modify proposed resolutions or escalate directly to Senior Management.
  - Close complaints with formal customer notifications.
