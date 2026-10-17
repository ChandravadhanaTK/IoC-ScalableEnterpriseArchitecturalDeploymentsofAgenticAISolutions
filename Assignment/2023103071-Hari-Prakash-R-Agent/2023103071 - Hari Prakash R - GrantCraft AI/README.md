# GrantCraft AI: Scalable Enterprise Multi-Agent Funding \& CSR Copilot for NGOs

🔗 **Live Deployed Application:** [https://pixel-perfect-buddy-326.lovable.app/](https://pixel-perfect-buddy-326.lovable.app/)  
📄 **Lovable Prompt File:** [`./prompt.md`](./prompt.md)

\---

## 📌 Executive Summary

Small non-profits (NGOs), educators, and community relief organizations routinely miss out on Corporate Social Responsibility (CSR) funds and institutional grants due to complex regulatory compliance, strict budget caps, and resource-intensive proposal drafting.

**GrantCraft AI** is an enterprise-grade, multi-agent AI system that automates grant discovery, regulatory eligibility auditing, grounded proposal drafting, and deterministic financial budget verification—governed by strict security guardrails and a mandatory Human-in-the-Loop (HITL) approval gate.

\---

## 🏛️ The Five Enterprise Architecture Capstone Deliverables

### 1\. Architecture Diagram (Layers, Components, Trust Boundaries \& Integrations)

The system is architected across four isolated tiers separated by three explicit zero-trust boundaries:

+-----------------------------------------------------------------------------------+
| LAYER 1: CLIENT \& PRESENTATION LAYER                                              |
| \[React Command Center UI]  \[Role-Based Views (RBAC)]  \[HITL Director Console]     |
+-----------------------------------------------------------------------------------+
|
================== TRUST BOUNDARY 1: Public Edge -> API Gateway ====================
(TLS 1.3, OAuth2/JWT Validation, WAF, Rate Limiter)
v
+-----------------------------------------------------------------------------------+
| LAYER 2: SECURITY \& GUARDRAIL GATEWAY                                             |
| \[Prompt Injection Filter]  \[Presidio PII Redactor]  \[Output Hallucination Gate]   |
+-----------------------------------------------------------------------------------+
|
================ TRUST BOUNDARY 2: Gateway -> Agent Runtime (mTLS) =================
v
+-----------------------------------------------------------------------------------+
| LAYER 3: STATEFUL MULTI-AGENT ORCHESTRATION LAYER (LangGraph)                     |
|  +-----------------+   +-------------------+   +------------------+   +---------+ |
|  | 1. Grant Scout  |-->| 2. Compliance     |-->| 3. Proposal      |-->| 4. Fin. | |
|  |    Agent        |   |    Auditor Agent  |   |    Architect     |   | Auditor | |
|  +-----------------+   +-------------------+   +------------------+   +---------+ |
|  \[Redis Shared State \& Checkpointer]   \[LiteLLM Router: Claude 3.5 -> Gemini Pro] |
+-----------------------------------------------------------------------------------+
|
============ TRUST BOUNDARY 3: Sandboxed Tool \& Tenant Data Access (RLS) ===========
v
+-----------------------------------------------------------------------------------+
| LAYER 4: KNOWLEDGE, TOOLING \& DATA LAYER                                          |
| \[Pinecone Vector DB (Tenant Isolated)]  \[PostgreSQL Compliance DB]                |
| \[Isolated Python Math Sandbox]          \[External CSR \& NGO Darpan APIs]          |
+-----------------------------------------------------------------------------------+



\---

### 2\. Agent Workflow Design (Roles, States, Tools, Handoffs, Approvals \& Failure Paths)

#### Multi-Agent Orchestration Matrix

|Agent Role|State|Assigned Tools|Input / Output Handoff Contract|Failure Path \& Mitigation|
|-|-|-|-|-|
|**1. Grant Scout Agent**|`DISCOVERING`|`Grant\_Vector\_Search`, `CSR\_Portal\_API`|**In:** NGO mission \& funding target.<br>**Out:** Top 3 matched grants with similarity scores \& deadlines.|**Low Match (<70%):** Triggers automated query expansion; if still <70%, halts and prompts user to broaden scope.|
|**2. Compliance \& Eligibility Agent**|`AUDITING`|`NGO\_Doc\_Parser`, `Policy\_Rule\_Engine`|**In:** Matched grant rules + NGO registration certs.<br>**Out:** Verified compliance checklist (`PASS`/`FAIL`).|**Missing Tax/Legal Cert (80G/12A/501c3):** Immediately halts pipeline in `FAILED\_SAFE` state before expensive LLM drafting and outputs remediation steps.|
|**3. Proposal Architect Agent**|`DRAFTING`|`Impact\_RAG\_Retriever`, `Citation\_Verifier`|**In:** Verified compliance state + past NGO impact metrics.<br>**Out:** Structured proposal with KPIs and inline citations.|**Low Groundedness (<0.85):** Rejects draft and re-runs generation at `temperature=0.0` enforcing strict RAG source citations.|
|**4. Financial Auditor Agent**|`VERIFYING\_MATH`|`Python\_Sandbox\_Calc`, `Cap\_Rule\_Checker`|**In:** Proposal draft + total budget target.<br>**Out:** Line-item budget table with verified overhead caps.|**Admin Cap Violation (>10% overhead):** Automatically re-allocates line items in deterministic Python sandbox until `Admin\_Pct <= 10%`.|

#### Human-in-the-Loop (HITL) Approval Gate

* **State:** `AWAITING\_DIRECTOR\_SIGN\_OFF`
* **Mechanism:** Pipeline execution pauses and persists state in Redis. Only a user authenticated with the **NGO Director** role can execute:

  1. **Approve \& Export Signed Proposal:** Generates an immutable SHA-256 audit hash and finalizes the submission.
  2. **Request Budget Revision:** Loops state back to `VERIFYING\_MATH` with human constraints.
  3. **Reject \& Halt:** Terminates workflow and logs the rejection reason.

\---

### 3\. Deployment Strategy (Runtime, Scaling, Resilience, Environments \& Release)

* **Containerized Runtime:** Stateless FastAPI + LangGraph agent workers packaged as Docker containers running on **Google Cloud Run / AWS EKS**.
* **Event-Driven Horizontal Scaling:** **KEDA (Kubernetes Event-driven Autoscaling)** monitors the Redis task queue depth and scales worker pods from **2 baseline pods up to 25 pods** during peak grant deadline bursts.
* **Multi-Model Resilience \& Failover:** Managed via **LiteLLM Proxy** with an automated circuit breaker:

  * *Primary Model:* Claude 3.5 Sonnet / GPT-4o (timeout threshold: 8s).
  * *Fallback Model:* Gemini 1.5 Pro (automatic failover in `<150ms` upon HTTP `429 Rate Limit` or `503 Service Unavailable`).
* **Environments \& Release Pipeline:**

  * `Dev`: Local mock tools and synthetic NGO profiles.
  * `Staging`: Automated CI evaluation suite running **100 Golden Dataset grant scenarios** via **Ragas** (must achieve $\\ge 92%$ Faithfulness and $100%$ Math Pass Rate).
  * `Production`: **Blue/Green deployment** with **10% Canary traffic shifting** and automated rollback if guardrail intervention rates spike above $2%$.

\---

### 4\. Security Model (Identity, Authorization, Secrets, Privacy, Guardrails \& Audit)

* **Identity \& Role-Based Access Control (RBAC):**

  * **NGO Grant Writer:** Can initiate agent runs and edit project descriptions.
  * **Finance Auditor:** Can inspect and adjust budget line-item rules.
  * **NGO Director (HITL Approver):** Exclusive cryptographic authority to approve/reject final proposals.
* **Secrets \& Multi-Tenant Privacy:**

  * All LLM and external API credentials are injected at runtime via **HashiCorp Vault / AWS Secrets Manager** with 30-day automated rotation.
  * Strict tenant isolation via **PostgreSQL Row-Level Security (RLS)** and dedicated **Pinecone namespaces (`tenant\_id`)** so NGO A can never access NGO B's proprietary records.
* **Input/Output Guardrails:**

  * **PII Redaction:** Microsoft Presidio strips donor names, PAN/EIN tax IDs, phone numbers, and bank account numbers (`\[REDACTED\_TAX\_ID]`, `\[REDACTED\_BANK\_ACCT]`) *before* any payload leaves Trust Boundary 2.
  * **Prompt Injection Defense:** Lakera Guard / NeMo Guardrails block jailbreak attempts and unauthorized tool calls.
* **Immutable Audit Trail:** Every state transition, tool invocation, PII redaction event, and HITL decision is logged to an append-only audit table with a cryptographic **SHA-256 hash**.

\---

### 5\. Monitoring Dashboard Design (Health, Trace, Quality, Safety, Cost \& Business Outcomes)

The built-in Observability Dashboard tracks six core operational pillars:

1. **System Health:** Cluster uptime (`99.98%`), P50/P95 latency per agent (`1.1s` – `2.8s`), active worker pod count, and API error rate (`0.12%`).
2. **Distributed Trace Explorer:** OpenTelemetry waterfall traces detailing exact millisecond execution across Input Guardrails $\\rightarrow$ Vector Retrieval $\\rightarrow$ Agent LLM Calls $\\rightarrow$ Python Math Sandbox.
3. **Quality Metrics:** RAG Faithfulness (`96.4%`), Answer Relevance (`94.8%`), Citation Accuracy, and Deterministic Math Pass Rate (`100%`).
4. **Safety \& Guardrails:** Real-time counters for PII tokens redacted (`1,420+`), prompt injections blocked, and pre-drafting compliance halts triggered.
5. **Cost Telemetry:** Token consumption segmented by agent role, average compute cost per completed proposal (`$0.38`), and daily budget burn rate.
6. **Business Outcomes (Social Impact KPIs):** Total NGO proposals audited (`342`), average grant-writing time saved per application (`18.4 hours`), compliance pass rate (`98.5%`), and total CSR funding unlocked (`$4.2M`).

