# Ticket Guardian: Lovable Build Prompt

> **How to use:** Paste everything below the line into Lovable as your first message. Enable **Lovable Cloud** when asked. Do not add any API key; the Lovable AI gateway is used.

---

Build a web app called **"Ticket Guardian"**: a multi-agent AI workflow that resolves customer complaints. It must use **real LLM calls** (no mocked or hard-coded agent output) and must visibly show **conditional routing** and a **generator-evaluator revision loop**.

## 1. Product overview

A support agent (or demo user) pastes an angry customer complaint. A **Triage Agent** classifies it and picks a route. **Only one** specialist runs (Billing, Technical, or Logistics). A **Policy Agent** checks the proposed resolution against an editable company policy. A **Writer Agent** drafts an empathetic reply. A **QA Agent** scores the draft and, if the score is below 8, sends feedback back to the Writer (maximum 2 retries). The final output is a customer reply, an internal case summary, and an escalation flag.

The point of the app is to **demonstrate agent orchestration**: conditional routing (not everything runs), grounding in a policy, a quality loop, and escalation logic. The pipeline UI is as important as the final output.

## 2. Architecture rules

- Frontend: React + TypeScript + Tailwind + shadcn/ui.
- Backend: **Lovable Cloud edge functions**. Use the **Lovable AI gateway** (`https://ai.gateway.lovable.dev/v1/chat/completions`) with the `LOVABLE_API_KEY` secret. Never ask the user for an API key and never expose keys in the frontend.
- Default model: `google/gemini-2.5-flash` for Triage, specialists and Policy; `google/gemini-2.5-pro` for Writer and QA (fall back to flash if unavailable).
- Create **one edge function per agent**: `triage-agent`, `billing-agent`, `technical-agent`, `logistics-agent`, `policy-agent`, `writer-agent`, `qa-agent`.
- The **frontend drives the pipeline** and the loop. It calls functions in order, decides which specialist to call from the Triage `route` field, and manages the Writer ↔ QA loop. This keeps the status visible after every stage and avoids edge function timeouts.
- Every agent returns **structured JSON** (tool/function calling or JSON mode with a schema). Wrap parsing in a safe parser that strips markdown fences and retries once on invalid JSON.
- Temperature: 0.2 for Triage, specialists, Policy and QA; 0.6 for Writer.
- Handle gateway errors: on **429** show "Rate limit reached, please wait a moment and retry"; on **402** show "AI credits exhausted, add credits in Lovable settings". Never show raw stack traces.
- Limit complaint input to 5,000 characters and policy input to 8,000 characters. Reject empty input.

## 3. Pipeline

```
Complaint + Company policy
        │
        ▼
[1 Triage Agent] → category, urgency, sentiment, intent, route
        │
        ▼  conditional routing: exactly ONE runs
        ├──► [2a Billing Agent]
        ├──► [2b Technical Agent]
        └──► [2c Logistics Agent]
        │
        ▼
[3 Policy Agent] → compliance check, adjusted resolution
        │
        ▼
[4 Writer Agent] → customer reply draft  ◄──────────┐
        │                                            │ score < 8 and retries left
        ▼                                            │ (feedback sent back)
[5 QA Agent]  → score 0-10 + feedback ───────────────┘
        │
        ▼ score >= 8, or retries exhausted
Final reply + internal case summary + escalation flag
```

Maximum attempts: **3** (1 initial draft + 2 retries).

## 4. Agent specifications

### 4.1 Triage Agent (`triage-agent`)

**Input:** `{ complaint }`

**System prompt:**
```
You are a support triage specialist. Read the customer complaint and classify it.
Determine:
- category: "billing" (charges, refunds, subscriptions, invoices), "technical" (bugs, defects, malfunctions, setup problems), or "logistics" (shipping delay, lost/damaged parcel, wrong item, delivery issues). If it mixes topics, pick the one the customer cares about most and list the others as secondary_categories.
- urgency: low | medium | high | critical (critical = safety risk, legal threats, large financial loss, repeated failures, VIP or churn threat)
- sentiment: angry | frustrated | neutral | polite | confused
- intent: what the customer wants (refund, replacement, fix, information, compensation, escalation)
- key_facts: order IDs, amounts, dates, product names, previous contact attempts, exactly as written
- route: one of "billing" | "technical" | "logistics"
- missing_info: facts needed to resolve that the customer did not provide
Do not invent facts. Output JSON only.
```

**Output schema:**
```json
{
  "category": "billing|technical|logistics",
  "secondary_categories": [""],
  "urgency": "low|medium|high|critical",
  "sentiment": "angry|frustrated|neutral|polite|confused",
  "intent": "",
  "key_facts": { "order_id": "", "amount": "", "dates": [""], "product": "", "previous_contacts": "" },
  "missing_info": [""],
  "route": "billing|technical|logistics",
  "reasoning": ""
}
```

### 4.2 Billing Agent (`billing-agent`)

**Input:** `{ complaint, triage }`

**System prompt:**
```
You are a billing and payments specialist. Diagnose the billing problem described: double charges, wrong amounts, failed refunds, subscription disputes, unrecognized charges, taxes/fees.
Provide the most likely root cause (and alternatives if uncertain), what evidence should be checked internally, and a proposed resolution
(refund, partial refund, credit, correction, explanation) with specific amounts only if stated in the complaint. 
Never promise anything that contradicts common sense; the Policy Agent will validate later. Output JSON only.
```

**Output schema:**
```json
{
  "agent": "billing",
  "diagnosis": "",
  "likely_causes": [""],
  "internal_checks": [""],
  "proposed_resolution": { "action": "", "amount": "", "timeline": "", "details": "" },
  "customer_actions_needed": [""]
}
```

### 4.3 Technical Agent (`technical-agent`)

**Input:** `{ complaint, triage }`

**System prompt:**
```
You are a technical support engineer. Diagnose the product defect or malfunction described.
Provide likely causes, step-by-step troubleshooting the customer can try (only if the problem is plausibly fixable remotely), 
whether a repair, replacement, or return is the most sensible outcome, and what information or evidence (photos, serial number, logs) to request.
Flag any safety concerns (overheating, electrical issues, injury) clearly. Output JSON only.
```

**Output schema:**
```json
{
  "agent": "technical",
  "diagnosis": "",
  "likely_causes": [""],
  "troubleshooting_steps": [""],
  "safety_concern": false,
  "proposed_resolution": { "action": "repair|replace|refund|troubleshoot|escalate", "timeline": "", "details": "" },
  "evidence_to_request": [""]
}
```

### 4.4 Logistics Agent (`logistics-agent`)

**Input:** `{ complaint, triage }`

**System prompt:**
```
You are a logistics and delivery specialist. Diagnose the shipping problem described: delays, lost parcels, wrong or damaged items, failed delivery attempts, address issues.
Provide the likely cause, internal steps (carrier trace, warehouse check, address verification), a proposed resolution
(reship, refund, expedite, re-attempt delivery, compensation) and a realistic timeline. Do not invent tracking numbers or carrier statuses. Output JSON only.
```

**Output schema:**
```json
{
  "agent": "logistics",
  "diagnosis": "",
  "likely_causes": [""],
  "internal_checks": [""],
  "proposed_resolution": { "action": "reship|refund|expedite|reattempt|compensate|investigate", "timeline": "", "details": "" },
  "customer_actions_needed": [""]
}
```

### 4.5 Policy Agent (`policy-agent`)

**Input:** `{ policy_text, triage, specialist_output }`

**System prompt:**
```
You are a compliance reviewer. Compare the specialist's proposed resolution against the company policy provided. The policy text is the ONLY source of truth.
Check eligibility windows, refund limits, required evidence, compensation limits, and escalation rules.
Return: whether the proposal is compliant, each violation with the exact policy line it breaks, the adjusted resolution that fits the policy while being as helpful to the customer as allowed,
what the agent is NOT allowed to promise, and whether the policy requires human approval.
If the policy does not cover the situation, say so and recommend escalation instead of guessing. Output JSON only.
```

**Output schema:**
```json
{
  "compliant": true,
  "violations": [{ "proposal_part": "", "policy_quote": "", "explanation": "" }],
  "adjusted_resolution": { "action": "", "amount": "", "timeline": "", "details": "" },
  "must_not_promise": [""],
  "policy_gaps": [""],
  "requires_human_approval": false,
  "policy_quotes_used": [""]
}
```

### 4.6 Writer Agent (`writer-agent`)

**Input:** `{ complaint, triage, policy_output, previous_draft?, qa_feedback?, attempt }`

**System prompt:**
```
You are a senior customer-support writer. Write the reply to the customer.
Tone rules based on sentiment: angry or frustrated -> acknowledge feelings first, apologize sincerely once (not repeatedly), be direct and concrete; 
confused -> simple language and short steps; polite or neutral -> warm and efficient.
Structure: greeting by name if known, empathy line, what we found, what we are doing (the policy-approved resolution only), exact next steps and timeline, what we need from the customer (if anything), sign-off.
Rules: use ONLY the adjusted resolution from the policy output; never promise anything listed in must_not_promise; never invent order details, names, or timelines; no corporate jargon; keep under 180 words unless the issue demands more.
If qa_feedback is provided, revise the previous draft to fix every point in the feedback and keep what already worked. Output JSON only.
```

**Output schema:**
```json
{
  "subject": "",
  "reply": "",
  "tone_used": "",
  "changes_made": [""]
}
```

### 4.7 QA Agent (`qa-agent`)

**Input:** `{ complaint, triage, policy_output, draft }`

**System prompt:**
```
You are a strict customer-support quality reviewer. Score the draft reply from 0 to 10 on each dimension:
- tone (matches the customer's sentiment, empathetic but not groveling)
- accuracy (matches the complaint facts, nothing invented)
- policy_compliance (no forbidden promises, matches the adjusted resolution)
- clarity (clear next steps and timeline, easy to read)
- completeness (addresses every issue the customer raised)
overall = weighted average (policy_compliance and accuracy weigh double). 
List specific, actionable feedback for the writer, quoting the problem sentences. Only give overall 8 or above if the reply is genuinely ready to send. Output JSON only.
```

**Output schema:**
```json
{
  "scores": { "tone": 0, "accuracy": 0, "policy_compliance": 0, "clarity": 0, "completeness": 0 },
  "overall": 0,
  "passed": false,
  "problems": [{ "quote": "", "issue": "" }],
  "feedback_for_writer": "",
  "strengths": [""]
}
```

## 5. Frontend orchestration logic

1. On **Resolve**: validate input, reset all nodes to **Idle**, clear previous results.
2. Call `triage-agent`. Show the result immediately in the Triage card (category, urgency, sentiment chips).
3. **Conditional routing:** read `route` and call only the matching specialist. Mark the other two specialist nodes as **Skipped** (greyed out, strikethrough label "not needed").
4. Call `policy-agent` with the policy text and the specialist output.
5. **Revision loop:** set `attempt = 1`.
   - Call `writer-agent` → call `qa-agent`.
   - If `overall >= 8` → exit the loop (approved).
   - Else if `attempt < 3` → increment `attempt`, call `writer-agent` again with `previous_draft` and `feedback_for_writer`, then `qa-agent` again. Show a loop arrow between Writer and QA with the label "Attempt 2/3".
   - Else → exit the loop with the best-scoring draft and mark "QA threshold not reached".
6. **Escalation logic:** set `escalate = true` if any of these are true: triage urgency is `critical` or `high`, policy `requires_human_approval`, policy has `policy_gaps`, technical `safety_concern` is true, or QA never reached 8. Collect the reasons in a list.
7. Generate the **internal case summary** on the client from the structured outputs (no extra LLM call): ticket category, urgency, diagnosis, resolution, policy notes, QA attempts and scores, escalation reasons, recommended next internal actions.
8. If one agent fails, mark it **Failed**, stop the pipeline, keep earlier results visible, and show a Retry button for that stage.

## 6. UI specification

**Header:** logo + "Ticket Guardian", tagline "AI agents that triage, resolve and quality-check support tickets", theme toggle, "How it works" link.

**Left column (input):**
- Textarea for the customer complaint with character counter.
- **Load sample complaint** dropdown with three options (Billing / Technical / Delivery, see section 7).
- Collapsible **Company policy** panel with an editable textarea prefilled with the sample policy (section 8) and a "Reset to default" link. Show a small note: "Change the policy and resolve again to see agent decisions change."
- Buttons: **Resolve**, **Clear**.

**Center: live flow diagram.** Nodes: Triage → [Billing | Technical | Logistics] → Policy → Writer ⇄ QA → Final. Node states: Idle (grey), Running (pulsing blue), Done (green), Skipped (dim grey, dashed outline), Failed (red). The routed specialist highlights and the other two dim. A curved loop arrow connects QA back to Writer and shows the attempt counter (for example "Attempt 2/3") and the last score. Responsive: stacks vertically on mobile.

**Right column (Agent cards):** one card per agent with icon, name, one-line role, status badge, spinner, elapsed time, a readable summary (chips, bullet points) and a **Raw JSON** toggle. Skipped specialists appear as collapsed grey cards labeled "Skipped by router".

**Bottom: Results.**
- **Final customer reply** (subject + body) with a **Copy** button and a green "Approved by QA (score 8.6)" badge, or an amber "Best effort (score 7.2): human review recommended" badge.
- **QA score history**: small table or bar chart across attempts with per-dimension scores, so the audience sees the draft improving.
- **Draft comparison**: a toggle to view Attempt 1 vs Final side by side, highlighting what changed (use the Writer's `changes_made`).
- **Internal case summary** card (copyable).
- **Escalation badge**: red "Escalate to human" with the reasons listed, or green "No escalation needed".
- **Policy check panel**: shows violations found, the exact policy lines quoted, and the adjusted resolution (proves grounding).

**Extras:**
- **"View agent logs" toggle**: console-style panel with timestamped events (for example `[00:03.2] triage → route=billing`, `[00:11.4] qa score 6.5, sending back to writer (attempt 2/3)`).
- **"How it works"** section: short explanation of routing, policy grounding, the generator-evaluator loop and escalation rules.
- Footer: "AI-generated replies should be reviewed by a human before sending. Demo project."

## 7. Sample complaints (for "Load sample complaint")

**Billing:**
```
Subject: CHARGED TWICE AND NOBODY IS REPLYING!!

Hi, I'm Karthik. I subscribed to your Pro plan on 3 September (order #SUB-48213) and got charged Rs. 1,499 TWICE on the same day. I've emailed your team two times already and got no response. I need the extra Rs. 1,499 back immediately or I will dispute it with my bank and cancel my subscription. This is ridiculous.
```

**Technical:**
```
Subject: Brand new mixer stopped working after 5 days

Hello, I bought the BlendMax 600 mixer grinder (order #BM-77120) on 20 September and it already makes a burning smell and stops after a minute of use. The motor also got very hot to touch. I'm worried this is dangerous because I have small kids at home. I want a replacement or my money back. Please advise.
```

**Delivery:**
```
Subject: Order delayed for 3 weeks

Dear team, I'm Meena. I ordered a study desk (order #DSK-90551) on 8 September with a promised delivery of 15 September. It's October now and the tracking has shown "In transit" for 12 days with no update. I need this for my daughter's exams. Please tell me where my order is and what you will do about it.
```

## 8. Sample company policy (prefilled, editable)

```
ACME STORE SUPPORT POLICY

REFUNDS
1. Duplicate or erroneous charges are refunded in full to the original payment method within 5-7 business days after verification.
2. Subscription refunds for a non-duplicate charge are available only within 7 days of the charge date.
3. Refunds above Rs. 5,000 require human manager approval.
4. Agents must never promise compensation beyond the refunded amount unless a manager approves.

PRODUCTS
5. Products have a 7-day replacement window for defects from the delivery date; after that, repair under the 1-year warranty.
6. A replacement requires a photo or video of the defect and the order ID.
7. Any report involving overheating, burning smell, electric shock or injury is a SAFETY CASE: tell the customer to stop using the product immediately and escalate to a human within 24 hours. Agents must not ask the customer to continue troubleshooting a safety case.

SHIPPING
8. Standard delivery is 5-7 business days. A delay of more than 7 days beyond the promised date qualifies for a Rs. 200 store credit.
9. If a parcel shows no tracking update for 7 days, it is treated as lost; the customer may choose a reship or a full refund.
10. Agents must not guarantee a specific delivery date unless confirmed by the carrier.

GENERAL
11. Response promise: all tickets are answered within 24 hours.
12. Legal threats, chargeback threats, or media threats must be escalated to a human.
13. Never share internal investigation notes with the customer.
```

## 9. Error handling and edge cases

- Complaint that is spam or not a complaint: Triage sets `route = "none"` and the UI shows "This doesn't look like a support complaint" and stops.
- Invalid JSON from an agent: retry once with "Return valid JSON only"; if it fails again, mark that agent **Failed** with a friendly message.
- Timeout: 60 seconds per agent, then **Failed** with a Retry button.
- Never lose completed outputs when a later stage fails.
- Prevent double-clicking Resolve while a run is in progress.
- If the Writer's output is empty, count it as a failed attempt and continue the loop.

## 10. Design guidelines

Warm, friendly, professional. Soft off-white background, teal as the primary color, amber for warnings, red for escalation, rounded-2xl cards, soft shadows, Inter font. Full light/dark mode. Animate node state changes (pulse while running, tick when done, dashed fade for skipped). Make the loop arrow and attempt counter visually prominent since it is the key demo moment. Mobile responsive and keyboard accessible.

## 11. Acceptance criteria

- Loading the billing sample routes to **Billing** only; the Technical and Logistics nodes are visibly skipped.
- Loading the technical sample triggers the policy's **safety case** rule, which results in a stop-using-the-product reply, an **escalation badge**, and no troubleshooting request.
- Loading the delivery sample routes to **Logistics** and applies the Rs. 200 credit or the reship/refund choice per policy, without promising a delivery date.
- The QA loop runs correctly: when the score is under 8 the Writer revises and the attempt counter updates; it never exceeds 3 attempts.
- Editing the policy (for example, changing the refund window to 3 days) and re-running changes the Policy Agent's verdict and the final reply.
- The agent logs toggle shows a timestamped trace; the final reply can be copied.
- The app works after clicking **Publish** on the live `*.lovable.app` URL.
