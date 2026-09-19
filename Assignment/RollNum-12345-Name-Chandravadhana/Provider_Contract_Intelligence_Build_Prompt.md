# Build Prompt: Provider Contract Intelligence Platform

Build a complete **Provider Contract Intelligence** web application using React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui. Use localStorage-backed mock APIs with rich seeded data for a healthcare payer/provider contract lifecycle demo. Do not build a backend.

---

## 1. Branding & Layout

- App name: **Provider Contract Intelligence**
- Left sidebar navigation, top header with search, notifications bell, and a **Switch User** dropdown supporting two personas: **Contract Loader (Emily Chen)** and **Legal Manager (Mark Thompson)**.
- Login page with role selection that routes users to persona-appropriate landing pages.

---

## 2. Sidebar Navigation (Left Pane)

| Screen | Description |
|---|---|
| Dashboard | Executive overview of contract KPIs, compliance scores, and pending action items across all modules |
| Contracts › Overview | Centralized list of all provider contracts with status filters, search, and quick access to contract details |
| Contracts › Digitize Legacy | AI-powered OCR pipeline converting scanned legacy provider contracts into structured, searchable digital documents |
| Contracts › NewGen Contract Creation | Guided contract drafting with full-generation, clause-by-clause co-authoring, playbook review, and draft-from-existing modes |
| Standard Clauses | Library of pre-approved clause templates with usage guidelines and version control |
| Contract Review | Side-by-side comparison of contract versions with redlining, comments, and approval workflows |
| Rates & Reimbursement | Fee schedule management with rate escalators, payment term tracking, and reimbursement modeling |
| Compliance Hub | Real-time compliance scoring, deviation alerts, clause redlining (with document switcher), and automated remediation recommendations |
| Credentialing | Provider credential verification pipeline including license, insurance, and accreditation tracking |
| Pipeline | End-to-end workflow orchestration from intake through signature, publication, and downstream system loading |
| Obligation Tracker | Centralized tracking of contractual obligations with owners, owning teams, frequency, due dates, and compliance status |
| Renewals | AI-driven renewal recommendations, timeline tracking, and rate comparison for expiring contracts |
| User Management | Role-based access control, user permissions, and audit trail administration |

---

## 3. Dashboard

Top KPI card row (clickable, each navigates to its module):
- **Total Contracts** — count of Digitize Legacy + NewGen Contract Creation documents
- **Contracts Created** — NewGen Contract Creation document count only
- **Contracts Digitized** — Digitize Legacy document count only
- **Compliance Score** — average compliance percentage
- **Redlining Pending** — count of documents in redlining

Then existing cards: stage distribution, expiring contracts, compliance trends (Recharts), recent activity feed, task summaries.

---

## 4. Digitize Legacy (Contract Loader Journey)

- Subtitle: "AI-powered digitization of legacy provider contracts"
- Document queue table: name, **Provider** (not "payer"), type, source, pages, OCR score, status, progress
- Upload modal with drag & drop, provider name, contract type (Auto-detect), source
- Clicking a document opens a **Contract Reader**: split view with document pages on left and extracted metadata/clauses on right, with clause highlighting
- Simulated OCR pipeline with step logs and progress animation

---

## 5. NewGen Contract Creation (Legal Manager Journey)

Landing page with **4 mode cards**:

1. **Full Draft Generation** — generate a complete contract draft from inputs in one step
2. **Clause-by-Clause Co-Authoring** — build the contract section by section with AI suggestions and edits
3. **Playbook-Guided with AI Review** — draft using playbook rules with compliance and risk checks
4. **Start Draft Generation with Existing Contract** — 3-step flow:
   - Step 1: Upload screen ("Contract intelligence, simplified") with drag & drop PDF upload and sample contract option
   - Step 2: Processing screen with animated spinner and deterministic step logs
   - Step 3: Split view — left contract viewer (52 mock pages, prev/next navigation, zoom) + right chat panel with suggested questions, page-level citation chips, and table excerpts

### Contract Viewer (shared, 3-pane layout)

- **Left pane**: extracted clauses list, categorized (Financial, Legal, Operational), each with confidence % and compliance score. Includes **Rate Schedule Extraction** clause positioned **above Rate Escalator**. Clicking a clause scrolls to and highlights that section in the center document.
- **Center pane**: full contract document with numbered sections, clause-level edit-by-typing, **delete clause icon**, **move up/down icons** (auto-renumbering), and an **EXHIBIT A – RATE SCHEDULE** table rendered before the signature block. Signature page with draw-to-sign canvas, apply signature, and submit back to pipeline. Support "Back to Pipeline" banner.
- **Right pane "Intelligence" tab**: Contract Metadata card, then a collapsible **RATE SCHEDULE** card below it with edit icon, a 7-row preview table, and "View full table (23 rows) →" link opening a full modal. Contract Intelligence items (e.g., HIPAA → Section 8, Risk Signals → Section 9) are clickable — clicking scrolls the center pane to the corresponding section and auto-expands it.

### Rate Schedule Data (all contracts)

Every contract gets a default `rateScheduleTable` (do not overwrite if present) with these groupings:
- **Contract Terms** (Effective Date, Term, Auto-Renewal, Termination Notice)
- **Base Administrative Fees** (PEPM fees: Medical, Pharmacy, Behavioral Health)
- **Broker/Paper Claim Fees** (per-claim fees by channel)
- **AWP-based Pricing** (Retail 30/90, Specialty — Generic/Brand with AWP discounts and dispensing fees)
- **Client Rebate Share** (Brand rebate percentages by channel)
- **Example Brand Drugs (metadata only)** (Retail 30 / Specialty examples like Lipitor, Humira, Enbrel, Keytruda)
- Total: 23 rows, 7 columns

### Contract Sections bar

Each section chip has a **comment icon (💬)** that navigates to the Redlining tab in Compliance Hub filtered to that section.

### Playbook-Guided mode additions

- **Save Contract** flow with naming suggestions matching existing document conventions (e.g., "Optum – Sunrise Health – Provider Agreement")
- **My Generated Contracts** list with a **View** button (eye icon) per draft navigating to the contract viewer
- Use "Provider Agreement" labels (not "Payer Agreement")

### Chatbot (compliance assistant)

- Detects compliance-improvement queries ("improve", "why 68%", "recommend", "what changes")
- For each clause, returns: current score, **why it scored that way**, **recommended changes** with regulatory citations (e.g., missing auto-renewal, effect-of-termination, member notification provisions), and projected improved score
- "Improve Compliance" buttons on clause cards scoring below 85% open the chat with a pre-filled query
- Keyword-based answer map for general contract questions

---

## 6. Pipeline (Delegate & Non-Delegate)

- Two tabs: **Delegated** and **Non-Delegated** pipelines
- Horizontal stage boxes (e.g., Intake, Credentialing, Drafting, Review, Signature, Published) with bracketed qualifiers shown on a **new line** and document counts as **(3)** — no "docs" keyword
- **Clicking a stage box filters the document table below** to only that stage; click again to deselect; "Clear filter" link; filter resets on tab switch
- **Clicking the Signature stage navigates to the contract document signature page** (auto-scrolls to signature block)
- Document table per pipeline with status, owner, dates

---

## 7. Compliance Hub

- **Redlining tab**: document dropdown switcher (e.g., Northeast / Southeast / Midwest agreements); each document has its own redline clause groups; left panel lists clause groups, detail view shows original vs. proposed text with accept/reject; per-document change summary counts
- **Obligation Compliance**, **Deviation**, and **Integrity** tabs with findings, severity badges, and remediation guidance
- Clause compliance scores seeded per clause (e.g., Termination Without Cause at 68% due to missing auto-renewal, effect-of-termination, records retention, and member notification clauses)

---

## 8. Obligation Tracker

- KPI row + a **Renewal Contracts card** that links to the Renewals page
- Table columns: Obligation, Contract, **Owner**, **Owning Team** (e.g., Finance, Legal & Compliance, Provider Relations), **Frequency** (One-time / Monthly / Quarterly / Annually — styled chips), Due Date, Status, and a **View** button per row
- **View button** navigates to the contract reader page showing all obligations and clauses for that contract
- Seed examples: quarterly utilization report (Provider Relations, Compliant), annual rate escalator review (Finance, Open), credentialing renewal verification (Credentialing Dept, In Progress), claims reconciliation audit (Claims Ops, Overdue), network adequacy compliance filing (Compliance Team, Open)

---

## 9. Renewals

- AI-driven renewal briefs per expiring contract: recommendation, rationale, rate comparison, timeline
- Generate renewal draft action linking into contract creation

---

## 10. Other Modules

- **Standard Clauses**: clause library with tags, search, version history
- **Contract Review**: rate table review with job checklist modal, approval comments, status workflow (Manual review / On hold / Exception / Sent for approval)
- **Rates & Reimbursement**: rate table rows with current/escalated/rounded rates, method, confidence badges
- **Credentialing**: checks per intake (license, DEA, malpractice, board certification) with Pass/Fail/Pending/Overridden and override audit
- **Downstream Feed**: field mapping to claims systems with confidence levels and load-ready score
- **User Management**: users, roles, module permissions (View/Edit/Approve/Admin), audit log drawer

---

## 11. Data & Simulation

- All data via a `mockApi` service over localStorage with seeded collections: contracts, contract families, digitization docs, redline documents/groups, tracker obligations, standard clauses, review requests, notifications, chat messages
- Simulated multi-agent pipeline (Intake Agent, Clause Matching Agent, Redlining Agent, Workflow Agent, Compliance Agent) with streaming status logs
- Global search across contracts, clauses, and obligations
- All UI text uses **"provider"** terminology (never "payer") and **"Contract Intelligence"** (never "ContractIQ")

---

## 12. Tech Constraints

- React 18, TypeScript, Vite, Tailwind CSS 3, shadcn/ui, React Router 6, TanStack Query, Recharts, React Hook Form + Zod, Lucide icons, Sonner toasts
- No backend; all persistence in localStorage; deterministic seeded demo data
- Semantic design tokens only (no hardcoded colors)
