# Sponsorship CRM Pipeline — Design

- **Date:** 2026-08-29
- **Status:** Approved by user (approach + all design sections reviewed in chat)
- **Runtime:** Python 3.11.9 (already installed)

## Purpose

A staged pipeline that turns ~3,000 emails from a student association (CSEA-like)
mailbox spanning ~10 years into a structured sponsorship CRM: every successful
sponsorship conversation identified, classified, extracted with verbatim
evidence, deduplicated by company, consolidated into per-company history, and
delivered as Excel/CSV for human review.

## Decisions (from brainstorming)

| Topic | Decision |
|---|---|
| Email access | Gmail API OAuth2 (primary). `.mbox` (Google Takeout export) import as fallback. |
| AI provider | Google Gemini free tier (AI Studio key), via provider-agnostic client. |
| Output | Excel + CSV. **No database**, no query tool. Consolidations computed in pandas. |
| Sponsorship scope | Money **and** in-kind. Both directions: companies→CSEA and CSEA→other orgs. |
| Success classes | `positive`, `negotiation`, `completed` considered successful; `interested_uncommitted` kept but separate; `negative`, `no_response`, `unrelated` excluded. |
| Human review | Directly in Excel: evidence column + blank `Verified` column; a re-export phase cleans the final outputs. |
| Architecture | Staged CLI pipeline, one command per phase, plain-JSON checkpointed state, idempotent & resumable. |

## Architecture

```
E:\Gmail Agent\
├─ config.yaml                    # org, events, model/key, thresholds
├─ evidence/                      # runtime state (safe to delete; regenerable)
│  ├─ raw/emailstore.jsonl
│  └─ state/{candidates,classifications,company_map}.json
├─ phase1_fetch.py                # Gmail API OAuth2 → emailstore.jsonl (--mbox fallback)
├─ phase2_candidates.py           # keyword + domain scoring → candidate threads
├─ phase3_classify.py             # batched Gemini JSON classification + extraction
│                                 #   (uses agents/classify.py; extraction folds in — no
│                                 #    separate phase4 runner)
├─ phase5_build.py                # dedup + consolidation → xlsx/csv exports
├─ phase6_review.py               # apply Verified column → cleansed final exports
├─ agents/
│  ├─ gmail_client.py             # Gmail OAuth2 wrapper (scope: gmail.readonly)
│  ├─ mbox_importer.py            # Takeout mbox → emailstore.jsonl
│  ├─ llm.py                      # provider-agnostic LLM client (Gemini default)
│  ├─ batching.py                 # pack N threads/call, adaptive to size
│  ├─ classify.py                 # prompts + schema validation + retry
│  ├─ score.py                    # keyword/domain scoring for candidates
│  ├─ dedupe.py                   # company normalization + fuzzy match
│  ├─ consolidation.py            # per-company history table
│  └─ export.py                   # Excel/CSV writers (openpyxl/pandas)
├─ tests/                         # offline unit tests + fixture + mocked e2e
├─ setup (README) instructions
```

Configuration (`config.yaml`): association name, known event names, Gemini
model + API key (env var `GEMINI_API_KEY` preferred), score thresholds,
outcome→success mapping, known company renames.

## Data formats

### emailstore.jsonl (one thread per line)

```json
{
  "thread_id": "1a2b3c...",
  "subject": "Sponsorship for CSEA Symposium 2024",
  "messages": [
    {"id":"...", "from":"rahul@abctech.com",
     "to":["csea.sponsorship@gmail.com"], "date":"2024-09-15T10:00:00Z",
     "body_text":"Dear team,\nWe are happy to sponsor your event..."}
  ],
  "participants": {"from_domains":["abctech.com"], ...},
  "first_date": "2024-09-15T10:00:00Z",
  "last_date": "2024-09-20T14:00:00Z",
  "direction_hint": "inbound|outbound|mixed"
}
```

Import dedupes on `thread_id` (and `message id`) so re-running a phase is idempotent.

### classifications.json (one object per thread)

```json
{
  "thread_id": "1a2b3c...",
  "outcome": "positive",
  "confidence": 0.92,
  "direction": "company_to_csea",
  "event": "CSEA Symposium 2024",
  "company": "ABC Technologies",
  "company_normalized": "abc technologies",
  "contact_person": "Rahul Kumar",
  "designation": "HR Manager",
  "email": "rahul@abctech.com",
  "phone": "+91 9876543210",
  "amount": "₹25,000",
  "amount_type": "money|in_kind",
  "in_kind_note": "venue and prizes" | null,
  "conversation_date": "2024-09-15",
  "evidence": "We are happy to sponsor your event...",
  "evidence_message_id": "msg_xyz"
}
```

`amount` is an exact string (`null` when unspecified). `confidence` gates
low-confidence rows for the reviewer's attention (flagged in the sheet).
`conversation_date` is the date of the decisive evidence message (the
`evidence_message_id` message), formatted `YYYY-MM-DD`.
`direction` is `company_to_csea` or `csea_to_company`; the schema is identical
for both — reverse sponsorships land in the CRM marked by their direction.

### Review workflow

`phase5` exports `review_sheet.xlsx`: one row per AI-classified thread,
evidence text in full, a `confidence` column, and a blank `Verified` column
(`Yes` / `Edit` / `Reject`). Reviewer edits rows in Excel. `phase6` imports
the edited sheet, keeps rows where `Verified` is `Yes` or `Edit`, replaces
edited field values, drops `Reject` and `Unrelated`/`Negative`/`No response`,
then writes the final exports.

### Final outputs (written by phase5 and re-written by phase6)

- `sponsorship_crm.xlsx` — workbook with sheets:
  - `Sponsorships` — one row per successful sponsorship (fields per schema above)
  - `Interested` — `interested_uncommitted` rows (kept separate)
  - `All Classified` — every classified thread (for audit)
  - `Evidence` — thread_id → full evidence quote + link anchor
- `sponsorship_history.csv` — one row per company: company, normalized
  company, first/last sponsorship year, sponsorship count, latest amount,
  latest event, latest contact, email, phone, status
- `sponsorship_crm.csv`, `interested.csv`, `all_classified.csv` — CSV mirrors

## Phase details

1. **Phase 1 — Fetch.** OAuth2 flow (`gmail.readonly`), cache token, query
   for all mail (or a configured filter), fetch threads read-only, write
   `emailstore.jsonl`. `--mbox <file>` path: parse eml/mbox into the same
   schema. No attachments stored; body text + metadata only.
2. **Phase 2 — Candidates.** Score each thread offline:
   - Keyword hits: `sponsor*`, `partnership`, `funding`, `contribute`,
     `support`, `CSR`, `corporate relations`, `invest*`, money markers
     (₹, Rs, INR, USD, amount), and event terms from config.
   - Sender-domain signal: company-like domains (non-`@gmail.com`,
     non-`@yahoo.com` personal, non-college `.*\.ac\.in` / `.edu`), weighted.
   - Composite score crosses threshold → candidate.
   - **Broad pass:** remaining threads' subjects + first 200 chars sent to
     Gemini in one batch to catch sponsorships that never said "sponsor".
     Only flagged ones join candidates. This second pass stays small.
3. **Phase 3+4 — Classify & extract.** Batched Gemini call (JSON mode).
   Deterministic schema validation: any string that doesn't parse or misses
   required keys is rejected and retried (max 2 retries, then flagged
   `parse_error` and surfaced for the reviewer). Extracted fields filled from
   evidence only; never invented. Empty/unknown fields → `null`.
4. **Phase 5 — Dedup & consolidate.** Normalize: strip `Pvt/Ltd/Inc/LLC/Technologies/Corp.`
   suffixes, lowercase, collapse whitespace, strip legal niceties. Fuzzy match
   (difflib/rapidfuzz) with score threshold → `company_map.json` linking
   aliases (`TCS` → `Tata Consultancy Services`). Same-normalized company rows
   merge into history; distinct contact people retained separately. Edits the
   user makes in the review sheet feed back into the map for the next run.
5. **Phase 6 — Review.** Re-export cleansed final outputs per the review
   workflow above.

## Gemini usage, cost, robustness

- Default model `gemini-2.5-flash`; provider-agnostic `llm.py` lets you swap
  to DeepSeek/Claude/OpenAI by changing `config.yaml` + `agents/llm.py` (one
  interface).
- Batching: pack 10–25 threads per call, shrinking when any thread is large;
  requests/day for the whole archive is typically a handful → far under free
  tier.
- 429/5xx: exponential backoff, resume from checkpoint (never re-classify
  completed threads).
- Corrupt/non-UTF8/MIME: fall back to extracted text or skip the message with
  a `FLAGGED_INCOMPLETE` note in diagnostics.

## Error handling

| Failure | Behavior |
|---|---|
| OAuth setup / consent | Clear error naming the exact Google Cloud step that failed |
| API rate limit | Backoff + resume from checkpoint |
| LLM bad/partial JSON | Schema validation → retry ≤2 → flag `parse_error` |
| Unparseable message | Skip with `FLAGGED_INCOMPLETE` diagnostic |
| Re-run | Idempotent — reprocesses only missing items |

## Testing

- Unit tests (offline, no API): scoring thresholds, schema validator,
  company normalization, fuzzy dedup, consolidation math.
- Fixture `tests/fixtures/sample_emails.jsonl` (hand-written sample threads)
  drives classification prompts through a **mocked LLM client**.
- One end-to-end smoke test: fixture → phase2 through phase6 with mock client,
  asserting final workbook contents.

## Non-goals

- No database, no query tool/CLI beyond the phases (pivot tables in Excel).
- No attachments download, no email sending.
- No Google Sheets integration (future option; needs extra OAuth scope).
- Not a long-running scheduler — one-shot backfill with resumable phases.

## Future extensions (not in scope now)

- Provider swap is designed-in (llm.py).
- Incremental sync (batch history in Gmail API).
- Google Sheets output.
- Optional `query.py` over the exported CSVs if pivot tables prove awkward.