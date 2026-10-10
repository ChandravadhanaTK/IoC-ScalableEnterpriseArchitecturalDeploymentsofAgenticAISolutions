# Gmail Agent — Deliverables Presentation

**Date:** 2026-10-01 · **Branch:** `master` · **Tests:** `tests/` 43 passed · **Spec:** `docs/superpowers/specs/2026-10-01-gmail-agent-enterprise-design.md` · **Plan:** `docs/superpowers/plans/2026-10-01-frontend.md`

Status legend: **Built** = implemented, tested, committed · **Designed** = approved design in the spec, standalone `docs/architecture/*.md` files are a follow-up.

---

## 0. Resulting project structure (actual)

```
Gmail-Agent/
  agents/
    gmail_client.py mbox_importer.py llm.py batching.py config.py store.py
    score.py          # + candidate_threads_with_rules (Built)
    classify.py       # + allowed-set threading, CLASSIFY_SYSTEM_DYNAMIC (Built)
    rules.py          # NEW (Built): DEFAULT_RULES, validate_rules, match_thread, build_system_prompt
    consolidation.py export.py
  web/
    app.py            # NEW (Built): sidebar + Criteria + Categories + Run & Results
    vault.py          # NEW (Built): SessionVault (memory-only key + temp registry + wipe)
  config/
    rules.schema.json # NEW (Built)
    base.yaml         # Designed (config split; root config.yaml still active)
  docs/
    Gmail-Agent-Build-Prompt.md  # NEW (this delivery, item 1)
    Gmail-Agent-Deliverables.md  # NEW (this document, item 2)
    superpowers/specs/2026-10-01-gmail-agent-enterprise-design.md (Built)
    superpowers/plans/2026-10-01-frontend.md (Built)
  evidence/  # runtime state (raw/state/output), regenerable
  tests/     # test_vault.py, test_rules.py NEW (Built); 43 passed
```

Run: `py -m pip install -r requirements.txt` → `py -m streamlit run web/app.py` (http://localhost:8501).

---

## 1. Architecture Diagram (Designed — spec § Artifact 1; Built behavior matches it)

Layers: **Ingest** (`phase1_fetch`: Gmail API readonly / `.mbox` import → `evidence/raw/emailstore.jsonl`) → **Intelligence** (Scorer `score.py + rules.py` → Broad-pass LLM → Classifier `classify.py + llm.py`, both fed by `rules`) → **Delivery** (consolidation + `export.py` → xlsx/csv) → **Interaction** (Streamlit `web/app.py` ↔ rules + state, triggers runs).
Trust boundaries: Google OAuth token + LLM key never leave the local machine except over TLS to Google; `evidence/` is local-only; user rules are validated against schema before any pipeline use. Integrations: Gmail API (`gmail.readonly`), Gemini/Groq LLM, pandas/openpyxl export (offline). Canonical diagram: Mermaid source in the spec; standalone file `docs/architecture/01-architecture-diagram.md` is a follow-up.

## 2. Agent Workflow Design (Designed — spec § Artifact 2; Built for the UI path)

Roles: Fetcher → Scorer (rule weights summed, `score >= threshold` = candidate) → Broad-pass (catches paraphrases) → Classifier (dynamic prompt from custom categories, batched, retried) → Consolidator/Exporter → human Reviewer. States: `raw → candidate → classified/problem → exported → verified`; handoffs are `evidence/state/*.json` files with `diagnostics.jsonl` provenance. Approvals: `confidence < 0.6` or `parse_error` → review queue (UI expander + Excel `Verified` column). Failure paths built: bad LLM JSON → retry → `problems.json`; unknown custom outcomes → problems (never silently accepted); invalid rules → run blocked with messages; LLM/network/bad-key errors → `st.error` with key still wiped; re-runs idempotent.

## 3. Deployment Strategy (Designed — spec § Artifact 3; local deployment Built)

Runtime Python 3.11.9 (`py -m` commands — the 3.12 install on this machine is broken, 3.11 is canonical). Local: Streamlit (`8501`) + CLI phases. Env selection via `APP_ENV` + `config.yaml`; secrets only from `.env`/environment, never YAML. Scaling: `batch_max_threads`/`batch_target_chars` bound LLM payloads; per-batch checkpoints allow kill/resume. Release: git tags + frozen requirements + fixture→export smoke test; rollback = revert + regenerate `evidence/`. Standalone file `docs/architecture/03-deployment-strategy.md` is a follow-up.

## 4. Security Model (Built in code; standalone doc follow-up)

Identity: Google OAuth2 (`credentials.json` → cached `token.json`, chmod 600, gitignored). Authorization: local single-operator; UI separates Operator (rules + runs) from Reviewer (verify rows). Secrets: API key lives **only** in `SessionVault` server memory (`type="password"` input, never displayed), passed explicitly to `make_llm_client(cfg, api_key=key)` — never `os.environ`, disk, logs, YAML, or `evidence/` — and is overwritten + dropped in `finally` plus on **End Session** (with temps, results, widget state). Verified by secret scan (clean) and tests (wipe deletes key + temps). Privacy: attachments never fetched; PII-redaction display option designed. Guardrails: verbatim-evidence-only extraction, `evidence ≤ 200 chars`, currency-regex amounts else null, unknown fields null, secret-like content refused in rules. Audit: `diagnostics.jsonl` + `evidence_message_id` provenance.

## 5. Monitoring Dashboard Design (Designed — spec § Artifact 5; partially Built)

Specified panels (data from `diagnostics.jsonl` + `classifications.json` + `problems.json`): Health (fetch/candidate/classify rates, quota errors, last run), Trace (thread → score + matched rules → outcome → evidence), Quality (confidence histogram, per-category counts, `parse_error` list, low-confidence queue), Safety (redaction status, guardrail violations, YAML secret check), Cost (call/token counts, free-tier bar), Business (sponsors by event/company, committed totals, funnel, history). **Built today:** Run counts, results dataframe + CSV download, problems expander (Health/Trace/Quality core). Full six-panel Monitoring page + `docs/architecture/05-monitoring-dashboard-design.md` are follow-ups.

---

## 6. Website: mail criteria + resulting categories (Built)

- **Upload:** sidebar `.mbox` import → temp file (wipe-tracked) → thread count.
- **Criteria editor:** table of rules (`id/label/field/match/pattern/weight`) + threshold slider + **Test on loaded threads** (`hits/total`); validation blocks bad regex, duplicate ids, empty patterns (except `corporate_domain`).
- **Categories editor:** fully custom `name/description/examples` + uniqueness/required validation + live classifier-prompt preview. Seed defaults = 7 legacy outcomes, so existing behavior is preserved until the user customizes.
- **Run:** one click scores with custom rules, classifies with the dynamic prompt through the allowed-set validator (custom categories genuinely classify — the Critical defect found in final review was fixed and re-reviewed CLOSED), shows the `Classification` table (thread_id, outcome, confidence, direction, event, company, contact, amount, evidence…) with CSV download.
- Test evidence: 43 passed (incl. custom-category round-trip, threshold/pattern rejection, vault wipe); Streamlit headless boot clean; secret scan clean; final whole-branch review CLOSED with no open Critical/Important items.

## 7. Verification record

- `py -m pytest tests/ -q` → **43 passed** (was 30 at baseline; +13 from this build).
- Secret scan over `web/app.py, web/vault.py, agents/rules.py` → clean (only the `type="password"` input line matches).
- `py -m streamlit run web/app.py --server.headless true` → `You can now view your Streamlit app`, no import errors (checked on ports 8501/8507).
- Reviews: 5 per-task reviews clean + final whole-branch review → 1 Critical + 7 Important found → single fix wave (`8a88be4`) → scoped re-review **CLOSED 8/8**, no new breakage.
- Known follow-ups (non-blocking): Add-criterion box needs a pattern input (bare Add currently errors); `docs/architecture/01–05` standalone files + full Monitoring page + `config/base.yaml` split remain for the next plan.
