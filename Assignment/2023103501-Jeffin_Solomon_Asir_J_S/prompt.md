# Build Prompt: AuditLens — Agentic Invoice & Expense Auditor

**Student:** Jeffin Solomon Asir J S · **Roll No:** 2023103501
**Course:** Enabling Scalable Enterprises using Agentic AI

Build a complete **AuditLens** web application: a multi-agent AI system that captures invoices / employee expense claims, checks them against company policy, has an LLM auditor reason over each claim, and routes the claim to auto-approval or a human finance reviewer. Use browser localStorage with rich seeded demo data (no database). The only server code is one streaming AI endpoint.

---

## 1. Tech Stack
- Framework: **TanStack Start v1** (React 19, Vite 7, TypeScript), file-based routes in `src/routes`.
- Styling: **Tailwind CSS v4** with tokens in `src/styles.css` (oklch colours, `@theme inline`, `@utility` classes).
- AI: **Vercel AI SDK** (`ai`, `@ai-sdk/openai`) calling the **Lovable AI Gateway** Responses API (`https://ai.gateway.lovable.dev/v1`), model `openai/gpt-6-astra`, key in server env `LOVABLE_API_KEY` (never sent to the browser).
- Charts: **Recharts**. Icons: **lucide-react**. Markdown rendering: **react-markdown**. Validation: **zod**.

## 2. Design System ("Audit ledger")
- Background warm paper `oklch(0.965 0.014 85)` with faint horizontal ledger lines (repeating-linear-gradient every 32px).
- Primary deep ledger green `oklch(0.38 0.08 160)`; accent amber `oklch(0.72 0.14 65)`; destructive red `oklch(0.55 0.19 28)`; success green `oklch(0.55 0.13 150)`.
- Sidebar uses an `ink` surface `oklch(0.24 0.035 160)` with light text.
- Fonts (Google Fonts via `<link>` in root head): **Fraunces** for headings, **IBM Plex Sans** body, **IBM Plex Mono** for IDs, amounts and labels.
- Utilities: `panel` (card), `stamp` + `stamp-ok/warn/bad/idle` (rubber-stamp status badges: bordered, mono, uppercase), `btn-primary`, `btn-ghost`, `btn-danger`, `field`, `label`.
- Never hard-code colours in components; use tokens only.

## 3. Layout
- Left sidebar (desktop) / top scroll nav (mobile): logo (ShieldCheck icon + "AuditLens", subtitle "Invoice & Expense Agent"), links **Audit Queue (/)**, **Submit Claim (/submit)**, **Policy Book (/policies)**, **Monitoring (/monitoring)**, a "Reset demo data" link and the student name + roll number in the footer.
- Each route has its own `head()` with unique title/description/og tags.

## 4. Data Model & Store (`src/lib/store.ts`)
`Invoice { id, vendor, vendorGstin, employee, department, category (Travel|Meals|Software|Hardware|Consulting|Office), date, invoiceNo, currency "INR", items[{desc, qty, unit}], tax, total, hasReceipt, notes?, status, risk?, decision?, report?, auditedAt?, latencyMs? }`
`Status = PENDING | AUTO_APPROVED | NEEDS_REVIEW | APPROVED | REJECTED`
`AuditEvent { at, invoiceId, actor, action }` (append-only audit trail).

- Persist `{ invoices, events }` under localStorage key `auditlens.v1`; seed on first load. Read storage only inside `useEffect` (SSR-safe); expose `useStore()`, `updateInvoice(id, patch, event)`, `addInvoice`, `resetDemo`.
- Seed 8 claims that exercise every rule: an over-cap hotel (Taj Coromandel, ₹11,500/night), a team dinner with beer, a SaaS invoice with missing GSTIN, a clean Uber ride, a 41-day-old headphone purchase with no receipt, a **duplicate** of the dinner invoice (same vendor + invoice number), a clean office-supplies order, and a ₹1,77,000 consulting retainer.

## 5. Expense Policy (shown on /policies and sent to the AI)
1. Meals: max ₹2,500 per person per day; alcohol not reimbursable.
2. Travel: economy only; hotels max ₹8,000/night.
3. Any claim above ₹50,000 needs finance-manager approval.
4. Every claim needs an original receipt.
5. Vendor GSTIN must be 15 characters for B2B invoices.
6. Duplicate invoice numbers from the same vendor are rejected.
7. Claims must be submitted within 30 days.
8. Weekend expenses need a justification note.

## 6. Agent Pipeline (the core of the app)
Four agents run in sequence on the claim detail page `/invoices/$id`, shown as a 4-step progress strip:
1. **Intake & Extraction Agent** — structures the claim (line items, totals, tax, GSTIN, receipt flag). New claims come from the `/submit` form.
2. **Policy Engine (deterministic tool)** — `runPolicyEngine(invoice, allInvoices)` returns `Finding[] {rule, severity HIGH|MEDIUM|LOW, detail}` for: RECEIPT_REQUIRED, DUPLICATE_INVOICE, HIGH_VALUE, GSTIN_INVALID, LATE_SUBMISSION, WEEKEND_NO_JUSTIFICATION, ALCOHOL, HOTEL_CAP, MEAL_CAP (uses "(N people)" in the description). Rules run in code so they can never be hallucinated.
3. **AI Auditor Agent "Ledger"** — POST `/api/audit` (TanStack server route) with `{invoice, findings, policies}` validated by zod. Server calls `streamText` with `provider.responses("openai/gpt-6-astra")`, `providerOptions.openai = { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] }`, `maxRetries: 0`, passes `request.signal`, and returns `toTextStreamResponse()`. The system prompt makes it act as a senior internal auditor, never invent facts, and write markdown with sections **Summary, Findings, Fraud & Anomaly Signals, Recommendation** (<250 words), ending with the exact line `VERDICT: {"decision":"APPROVE|REVIEW|REJECT","risk":0-100,"confidence":0-1}`.
4. **Decision Router (guardrail)** — `routeDecision(decision, risk, findings)`: AUTO_APPROVED only if decision is APPROVE, risk < 30 and no HIGH findings; everything else (including any REJECT or duplicate) goes to NEEDS_REVIEW. The AI can never finally reject or pay on its own.

UI on the detail page: extracted data + line-item table, policy findings with severity stamps, streaming AI report (rendered with react-markdown, VERDICT line hidden), a **Stop** button that aborts the stream, friendly errors for 402 (credits used up) and 429 (rate limited), a **Human-in-the-loop** panel with Approve / Reject when status is NEEDS_REVIEW, and the per-claim audit trail. Every agent decision and human action writes an `AuditEvent`.

## 7. Screens
- **Audit Queue (/)**: KPI panels (claims, awaiting audit, needs review, value audited) and a table of all claims (ID link, vendor, employee, category, date, total, risk, status stamp).
- **Submit Claim (/submit)**: form for vendor, GSTIN, employee, department, category, date, invoice no, one line item (desc, qty, unit price), tax, receipt checkbox, notes; on submit creates the claim and navigates to its detail page.
- **Policy Book (/policies)**: numbered policy list (§1…§8).
- **Monitoring (/monitoring)**: six metric cards — Health (avg pipeline latency), Quality (claims audited), Safety (human overrides), Cost (estimated AI cost), Outcome (auto-approval rate, leakage prevented = value of risky claims not approved); a donut of claims by status; a bar chart of risk per audited claim; a scrolling trace log of all events.

## 8. Non-functional requirements
- API key only on the server; input validated with zod; no secrets in localStorage.
- Responsive layout; accessible buttons and labels.
- Deploy on Lovable (Cloudflare Workers edge runtime) and share the published URL.
