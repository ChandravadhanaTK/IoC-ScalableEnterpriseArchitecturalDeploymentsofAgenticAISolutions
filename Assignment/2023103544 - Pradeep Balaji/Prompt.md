# Lease Guard: Lovable Build Prompt

> **How to use:** Paste everything below the line into Lovable as your first message. Enable **Lovable Cloud** when asked. Do not add any API key; the Lovable AI gateway is used.

---

Build a web app called **"Lease Guard"**: a multi-agent AI workflow that reviews rental/lease agreements and produces a risk report. It must use **real LLM calls** (no mocked or hard-coded agent output) and must visibly show the agents working as a pipeline.

## 1. Product overview

A tenant pastes a lease. An **Orchestrator** reads it and decides how to split the work. Three **specialist agents** run **in parallel**. A **Critic** audits their findings. A **Synthesizer** merges everything into a final report with a risk score, top red flags, questions for the landlord, and a negotiation email.

The goal of the app is to **demonstrate agent orchestration** (routing, parallel fan-out, critic/review step, aggregation), so the pipeline UI matters as much as the final report.

## 2. Architecture rules

- Frontend: React + TypeScript + Tailwind + shadcn/ui.
- Backend: **Lovable Cloud edge functions**. Use the **Lovable AI gateway** (`https://ai.gateway.lovable.dev/v1/chat/completions`) with the `LOVABLE_API_KEY` secret. Never ask the user for an API key and never expose keys in the frontend.
- Default model: `google/gemini-2.5-flash` for specialists, `google/gemini-2.5-pro` for the Critic and Synthesizer (fall back to flash if unavailable).
- Create **one edge function per agent**: `orchestrator`, `legal-agent`, `financial-agent`, `rights-agent`, `critic-agent`, `synthesizer-agent`. Each takes JSON in and returns JSON out.
- The **frontend drives the pipeline**: it calls the functions in order and runs the three specialists with `Promise.all`. This makes status updates after every stage simple and avoids edge function timeouts.
- Every agent must return **structured JSON**. Use tool/function calling or JSON mode with a schema, and wrap parsing in a safe parser that strips markdown fences and retries once on invalid JSON.
- Temperature: 0.2 for specialists and critic, 0.4 for the synthesizer.
- Handle gateway errors: on **429** show "Rate limit reached, please wait a moment and retry"; on **402** show "AI credits exhausted, add credits in Lovable settings". Never show raw stack traces.
- Limit input to 20,000 characters; show a friendly validation message above that. Reject empty input.

## 3. Pipeline

```
Lease text (+ optional region, optional tenant concerns)
        │
        ▼
[1 Orchestrator]  → classifies lease, assigns clauses to specialists
        │
        ├──► [2a Legal Risk Agent]
        ├──► [2b Financial Agent]        (parallel, Promise.all)
        └──► [2c Tenant Rights Agent]
        │
        ▼
[3 Critic Agent]  → contradictions, unsupported claims, missed issues
        │
        ▼
[4 Synthesizer]   → final report
```

## 4. Agent specifications

All agents receive the full lease text plus their inputs. All must base every finding on **quoted lease text**. If something is not in the lease, they say it is missing rather than inventing it.

### 4.1 Orchestrator (`orchestrator`)

**Input:** `{ lease_text, region?, tenant_concerns? }`

**System prompt:**
```
You are the Orchestrator of a lease-review team. Read the lease and plan the review.
1. Identify lease type (residential, commercial, PG/co-living, other), parties, term, monthly rent, deposit.
2. Split the lease into numbered clauses (use the lease's own numbering if present; otherwise create your own).
3. Assign each clause to one or more specialists: "legal" (termination, penalties, liability, indemnity, dispute resolution, renewal, subletting),
   "financial" (rent, deposit, escalation, maintenance charges, fees, utilities, penalties with money amounts),
   "rights" (privacy and entry, repairs, habitability, eviction/notice, restrictions on guests/pets/use, deposit return).
4. Note anything unusual about the document itself (missing sections, ambiguous wording, unsigned parts).
Only assign what is needed. Be concise. Output JSON only.
```

**Output schema:**
```json
{
  "lease_summary": { "type": "", "parties": "", "term": "", "monthly_rent": "", "deposit": "", "region_assumed": "" },
  "clauses": [{ "id": "1", "title": "", "text": "" }],
  "assignments": { "legal": ["1","4"], "financial": ["2","3"], "rights": ["5","6"] },
  "document_notes": [""],
  "reasoning": "Why this split was chosen, 2-3 sentences"
}
```

### 4.2 Legal Risk Agent (`legal-agent`)

**Input:** `{ clauses_assigned, lease_summary, region? }`

**System prompt:**
```
You are a careful tenancy-law reviewer assisting a tenant. Review only the assigned clauses.
Look for: one-sided termination rights, excessive penalties or lock-in periods, broad indemnity or liability on the tenant,
unilateral changes by landlord, automatic renewal traps, subletting bans with penalties, vague wording, waiver of legal rights, unfair dispute resolution.
For each issue: quote the exact clause text, explain the risk in plain language, rate severity (low/medium/high/critical), and suggest a specific fix.
Do not cite specific statutes or section numbers unless you are highly confident; instead say "verify against local rental law". 
Do not invent clauses. If you find no issue in a clause, do not list it. Output JSON only.
```

**Output schema:**
```json
{
  "agent": "legal",
  "findings": [
    { "clause_id": "", "quote": "", "issue": "", "why_it_matters": "", "severity": "low|medium|high|critical", "suggested_fix": "", "confidence": 0.0 }
  ],
  "overall_legal_risk": 0,
  "summary": ""
}
```

### 4.3 Financial Agent (`financial-agent`)

**Input:** `{ clauses_assigned, lease_summary }`

**System prompt:**
```
You are a financial analyst reviewing a lease for a tenant. Review only the assigned clauses.
Extract and check: monthly rent, security deposit (amount, refund timeline, deduction rules), rent escalation, maintenance and society charges,
utility responsibility, late fees, brokerage, repair cost-sharing, exit penalties, any hidden or ambiguous charges.
Compute the estimated total cost of the lease term: rent over the full term with escalation + deposit (shown separately as refundable) + known fees. Show your arithmetic.
Flag deposits above typical norms and escalation above typical norms, but label these as "typical ranges vary by region".
Quote the exact text for every finding. Never invent numbers; if a figure is missing, list it under "missing_information". Output JSON only.
```

**Output schema:**
```json
{
  "agent": "financial",
  "key_figures": { "monthly_rent": "", "deposit": "", "escalation": "", "late_fee": "", "other_charges": [""] },
  "cost_estimate": { "term_months": 0, "total_rent": 0, "refundable_deposit": 0, "fees": 0, "total_outlay": 0, "arithmetic": "" },
  "findings": [
    { "clause_id": "", "quote": "", "issue": "", "why_it_matters": "", "severity": "low|medium|high|critical", "suggested_fix": "", "confidence": 0.0 }
  ],
  "missing_information": [""],
  "overall_financial_risk": 0,
  "summary": ""
}
```

### 4.4 Tenant Rights Agent (`rights-agent`)

**Input:** `{ clauses_assigned, lease_summary, region? }`

**System prompt:**
```
You are a tenant-rights advocate. Review only the assigned clauses.
Check: landlord entry and privacy (notice period, hours), repair and maintenance duties and timelines, habitability, notice period and grounds for eviction,
restrictions on guests, pets, work-from-home or lifestyle, deposit return conditions, retaliation, and any clause that tries to waive basic tenant protections.
Also list important protections that are MISSING from the lease.
Quote exact text for each finding. Do not cite specific laws unless highly confident; say "verify locally" instead. Output JSON only.
```

**Output schema:**
```json
{
  "agent": "rights",
  "findings": [
    { "clause_id": "", "quote": "", "issue": "", "why_it_matters": "", "severity": "low|medium|high|critical", "suggested_fix": "", "confidence": 0.0 }
  ],
  "missing_protections": [""],
  "overall_rights_risk": 0,
  "summary": ""
}
```

### 4.5 Critic Agent (`critic-agent`)

**Input:** `{ lease_text, orchestrator_output, legal_output, financial_output, rights_output }`

**System prompt:**
```
You are a skeptical senior reviewer auditing three junior analysts. For every finding, verify:
(a) the quoted text actually appears in the lease (exact or near-exact),
(b) the claim follows from the quote,
(c) the severity is reasonable.
Also detect: contradictions between agents, duplicate findings across agents, over-claiming of legal certainty, arithmetic errors in the cost estimate,
and important issues that all agents missed.
Return corrections, not a rewrite. Be strict but fair. Output JSON only.
```

**Output schema:**
```json
{
  "verified_findings": [""],
  "rejected_findings": [{ "agent": "", "quote": "", "reason": "" }],
  "severity_adjustments": [{ "agent": "", "quote": "", "from": "", "to": "", "reason": "" }],
  "contradictions": [{ "between": ["legal","financial"], "description": "" }],
  "duplicates": [{ "quotes": [""], "merge_into": "" }],
  "arithmetic_check": { "correct": true, "notes": "" },
  "missed_issues": [{ "quote": "", "issue": "", "severity": "" }],
  "critic_verdict": "approve | approve_with_changes",
  "confidence_in_pipeline": 0.0,
  "notes": ""
}
```

### 4.6 Synthesizer (`synthesizer-agent`)

**Input:** all previous outputs.

**System prompt:**
```
You are the lead reviewer. Produce the final tenant-facing report using the specialists' findings AFTER applying the critic's corrections
(drop rejected findings, apply severity adjustments, merge duplicates, include missed issues).
Write in plain, friendly language a non-lawyer understands. Be specific and always tie red flags to quoted clauses.
Produce: an overall risk score 0-100 (0 = very safe, 100 = very risky) with a one-paragraph justification; the top 5 red flags ranked by severity and impact;
a list of "good things about this lease"; 6-10 smart questions to ask the landlord; a recommended list of clauses to negotiate with proposed replacement wording;
and a polite, firm negotiation email from the tenant. End with a one-line disclaimer that this is not legal advice. Output JSON only.
```

**Output schema:**
```json
{
  "risk_score": 0,
  "risk_level": "low|moderate|high|severe",
  "risk_justification": "",
  "top_red_flags": [{ "rank": 1, "title": "", "clause_quote": "", "severity": "", "explanation": "", "recommended_action": "" }],
  "positives": [""],
  "questions_for_landlord": [""],
  "negotiation_points": [{ "clause": "", "current": "", "proposed": "" }],
  "cost_summary": { "monthly_rent": "", "deposit": "", "estimated_total_outlay": "" },
  "negotiation_email": { "subject": "", "body": "" },
  "disclaimer": "This is not legal advice."
}
```

## 5. Frontend orchestration logic

1. On **Analyze**: validate input, reset all agent cards to **Idle**, record start time.
2. Call `orchestrator` → card status goes **Running → Done**; show elapsed time.
3. Call `legal-agent`, `financial-agent`, `rights-agent` together with `Promise.all`. All three cards switch to **Running** at the same moment and complete independently (this is the visible proof of parallelism). If one fails, mark it **Failed**, continue with the others, and tell the Critic which agent is missing.
4. Call `critic-agent` → then `synthesizer-agent`.
5. Render the final report. Show total pipeline time and per-agent time.
6. Provide a **Retry** button on any failed agent and a **Reset** button.

## 6. UI specification

**Header:** logo + "Lease Guard", tagline "A team of AI agents reviews your lease", theme toggle (light/dark), "How it works" link.

**Top: Agent flow diagram.** Horizontal node graph: Orchestrator → (Legal / Financial / Rights stacked in parallel) → Critic → Synthesizer. Nodes are grey when idle, pulsing blue when running, green when done, red when failed. Animated connecting lines highlight the active path. Must be responsive (stack vertically on mobile).

**Left column (input):**
- Large textarea for the lease with character counter.
- Optional **Region** dropdown (India, Tamil Nadu, Karnataka, Maharashtra, USA, UK, Other).
- Optional "What worries you most?" text input.
- Buttons: **Analyze**, **Load sample lease**, **Clear**.

**Right column (Agent Pipeline):** one card per agent with icon, name, role in one line, status badge (Idle/Running/Done/Failed), spinner, elapsed seconds, and an expandable section showing a readable summary (for example, findings count and severity chips) plus a **Raw JSON** toggle.

**Bottom (Final Report)**, appears after synthesis:
- **Risk gauge** (semicircle, 0-100, color-coded green/amber/red) with risk level label and justification.
- **Top 5 red flags**: cards with severity badges (Critical = red, High = orange, Medium = amber, Low = blue), quoted clause in a blockquote, explanation, recommended action.
- **Cost summary** tiles (rent, deposit, total outlay).
- **Positives** list.
- **Questions to ask the landlord** (checklist).
- **Negotiation points** table (Current vs Proposed).
- **Negotiation email** with subject, body, and **Copy** button.
- **Critic's notes** panel: what was corrected, rejected, or added (this shows the self-check value).
- Buttons: **Download report (Markdown)**, **Copy email**, **Analyze another lease**.

**Footer:** "Not legal advice. Lease Guard is an AI demo; consult a qualified professional."

**Extras:**
- **"View agent logs" toggle**: a console-style panel with timestamped events (`[00:02.1] orchestrator started`, `[00:05.8] legal-agent finished, 6 findings`).
- **"How it works" section**: a short explanation of orchestration, parallel agents, the critic step, and why structured JSON contracts matter.

## 7. Sample lease (for "Load sample lease")

Prefill the textarea with this text, which has deliberately planted problems:

```
RESIDENTIAL RENTAL AGREEMENT

This agreement is made on 1 June 2026 between Mr. R. Sundaram ("Landlord") and Ms. A. Priya ("Tenant") for the apartment at Flat 4B, Lakeview Residency, Chennai.

1. TERM: The lease term is 24 months starting 1 June 2026. The Tenant may not terminate the lease before 24 months. If the Tenant vacates early, the Tenant shall pay rent for the entire remaining period plus a penalty of 3 months' rent.
2. RENT: Monthly rent is Rs. 28,000, payable on or before the 1st of each month. Rent shall increase by 15% every 6 months.
3. LATE FEE: A late fee of Rs. 500 per day shall be charged for any delay in rent payment.
4. SECURITY DEPOSIT: The Tenant shall pay a refundable security deposit of Rs. 2,40,000. The deposit will be returned within 90 days after vacating, after deductions the Landlord considers necessary for repairs, painting, and cleaning, at the Landlord's sole discretion.
5. MAINTENANCE: The Tenant shall pay society maintenance of Rs. 3,500 per month, which may be revised by the Landlord at any time without notice. The Tenant is responsible for all repairs and replacements, including structural and plumbing issues.
6. ENTRY: The Landlord or his agents may enter the premises at any time without prior notice for inspection or showing the property.
7. USE: No guests may stay overnight for more than 2 days. No pets. The Tenant shall not work from home or run any business activity.
8. SUBLETTING: Subletting is prohibited. Breach will result in immediate termination and forfeiture of the entire security deposit.
9. TERMINATION BY LANDLORD: The Landlord may terminate this agreement at any time with 7 days' notice if he believes the Tenant has violated any term.
10. RENEWAL: This agreement renews automatically for another 24 months unless the Tenant gives written notice 6 months before expiry.
11. LIABILITY: The Tenant shall indemnify the Landlord against all claims, damages, or losses arising on the premises from any cause whatsoever.
12. DISPUTES: All disputes shall be resolved by an arbitrator appointed solely by the Landlord. The Tenant waives the right to approach any court.

Signed: ________________ (Landlord)     ________________ (Tenant)
```

## 8. Error handling and edge cases

- Non-lease or too-short text: the Orchestrator returns `lease_summary.type = "not_a_lease"`; the UI stops the pipeline and shows "This doesn't look like a rental agreement."
- Invalid JSON from an agent: retry once with "Return valid JSON only"; if it fails again, mark the agent **Failed** with a friendly message.
- Network timeout: 60 seconds per agent, then **Failed** with a Retry button.
- Never lose already-completed agent outputs when one agent fails.
- Prevent double-clicking Analyze while a run is in progress.

## 9. Design guidelines

Clean, modern, trustworthy. Neutral slate background, indigo as the primary color, rounded-2xl cards, soft shadows, generous spacing, Inter font. Full light/dark mode. Smooth transitions on status changes (fade and pulse). Mobile responsive: the columns stack, the flow diagram goes vertical. Accessible contrast and keyboard-navigable controls.

## 10. Acceptance criteria

- Clicking **Load sample lease → Analyze** runs all six agents with real LLM calls and shows a complete report.
- The three specialist cards visibly run at the same time.
- The Critic panel shows at least one correction or confirmation, and the final report reflects it.
- The risk score for the sample lease lands in the high/severe range, and the top red flags include the lock-in penalty, 15% six-monthly escalation, no-notice entry, one-sided arbitration, and auto-renewal.
- The negotiation email can be copied.
- The agent logs toggle shows a timestamped trace.
- The app works after clicking **Publish** on the live `*.lovable.app` URL.
