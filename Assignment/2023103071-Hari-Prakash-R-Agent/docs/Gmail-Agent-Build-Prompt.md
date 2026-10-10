# Gmail Agent — Build Prompt (generate this application from scratch)

> Copy everything below the line into a code-generation AI (or hand to a developer). It is self-contained: goal, stack, features, security rules, file layout, interfaces, and acceptance criteria. Source repo (if available): this directory — `agents/` pipeline + `config.yaml`.

---

## Goal

Build a **secure Streamlit frontend** for an existing Gmail sponsorship-CRM pipeline so a non-technical user can: upload a Google Takeout **`.mbox`** file, define mail-parsing **criteria** and result **categories** (both fully custom), enter a **Gemini/Groq API key** that lives **only in server memory and is wiped when the session ends**, click **Run** to automatically score → classify → show results, and download them in the specified format.

## Tech stack (exact)

- Python 3.11, Streamlit>=1.35, jsonschema>=4.0, pandas, google-genai, pytest>=8.0
- Run/test with `py -m streamlit run web/app.py`, `py -m pytest tests/ -q`, install with `py -m pip install -r requirements.txt`
- Existing pipeline modules to reuse (do not rewrite): `agents/mbox_importer.import_mbox(path)`, `agents/llm.make_llm_client(cfg, api_key=...)`, `agents/batching.make_batches`, `agents/classify.build_classify_prompt / parse_batch`, `agents/config.Config.load("config.yaml")`

## Features (all required)

1. **Sidebar — secrets + mailbox**
   - `st.text_input("Gemini / Groq API key", type="password")` + **Save key** button; show only `Key loaded: yes/no`, never the value.
   - `st.file_uploader(".mbox")` + **Import .mbox**: write upload to a per-session temp file (`tempfile.NamedTemporaryFile(delete=False, suffix=".mbox")`), register it for cleanup, parse with `import_mbox`, store threads in `st.session_state.threads`.
   - **End session (wipe key + temp files)** (primary button): overwrite + drop the key, delete all temp files, clear rules/threads/results/problems/widget state, `st.rerun()`.
2. **Criteria tab** — editable parsing rules. Each criterion: `id` (slug `^[a-z0-9_]+$`), `label`, `field` (`subject_and_body|subject|body|from_email|to_email`), `match` (`regex|contains|exact|corporate_domain`), `pattern`, `weight >= 0`. Threshold slider 0–10. **Add/Delete** with validation; **Test criteria on loaded threads** shows `hits / total` at threshold.
3. **Categories tab** — fully custom result categories. Each: `name` (slug), `description` (required), `examples` (one per line). **Add/Delete** with uniqueness validation. **Preview classifier prompt** expander rendering the generated system prompt.
4. **Run & Results tab** — gated **Run scoring + classification** button (blocked with a message when rules invalid, no threads loaded, or no key saved). On run: score threads with custom rules (`score = Σ matched weights`, candidate iff `score >= threshold`), build the classifier system prompt from the custom categories, call the LLM per batch, route unknown outcomes to problems, display results dataframe + **Download CSV** + problems expander. Show LLM errors via `st.error`, never a traceback.

## Security rules (non-negotiable)

- API key in **memory only** (`st.session_state`-backed holder object): never `os.environ`, never disk, never logs, never YAML, never `evidence/`, never displayed.
- Overwrite key material (`"x" * len`) before dropping references — for the holder, the LLM client, and the run-local variable — in a `finally` block so failures still wipe.
- Uploaded `.mbox` in OS temp dir, tracked per session, deleted on End Session.
- `rules`/config files must never contain secret-like keys (validate and refuse).
- Never commit `.env`, `credentials.json`, `token.json`, `evidence/`, `*.mbox`, or keys.

## Rules engine (build this)

- `agents/rules.py` with: `DEFAULT_RULES` (seed: criteria `sponsor_kw` weight 2.0 regex on subject+body, `money_markers` weight 1.0, `corp_sender` weight 1.0 corporate-domain on from_email; threshold 2.0; the 7 legacy categories as defaults), `validate_rules(data) -> list[str]` (slug ids/names, field/match enums, regex compiles, weight numeric ≥ 0, threshold numeric ≥ 0, version int ≥ 1, ≥1 category with description, empty pattern rejected except for `corporate_domain`, no secret-like content), `match_thread(thread, rules) -> (score, matched_ids)`, `build_system_prompt(association, categories) -> str` (verbatim-evidence-only instructions, JSON-array-with-index contract).
- `config/rules.schema.json` mirroring the same constraints.
- Classifier must accept **any outcome defined in the rules**, not a hardcoded list: thread an `allowed` set through `validate_classification(item, idx, allowed=None)` / `parse_batch(text, batch, cfg, allowed=None)` / `classify_batch(..., rules=None)` / `classify_all(..., rules=None)`, falling back to the legacy 7 outcomes when `allowed is None`.

## File layout (create/modify exactly)

- Create `web/__init__.py`, `web/vault.py` (`SessionVault`: `set_api_key/get_api_key/has_key/register_temp/wipe`), `web/app.py`, `agents/rules.py`, `config/rules.schema.json`, `tests/test_vault.py`, `tests/test_rules.py`
- Modify `agents/score.py` (add `candidate_threads_with_rules`), `agents/classify.py` (allowed-set threading + `CLASSIFY_SYSTEM_DYNAMIC`), `requirements.txt` (append streamlit, jsonschema)

## Acceptance criteria (must all hold)

- `py -m pytest tests/ -q` green; includes regression tests for: custom-category round-trip through `parse_batch`, rejection of empty-pattern/negative-threshold rules, vault wipe deleting key + temps.
- `py -m streamlit run web/app.py` boots with no import errors; manual pass: save key → dots only; import `.mbox` → count; add custom criterion + category → test counts change + preview shows it; run without key → blocked warning; bad key → `st.error`, no traceback; End Session → key/threads/results/temps cleared.
- Secret scan clean: no `os.environ[` writes of keys, no key prints/logs, no secrets in tracked files.
