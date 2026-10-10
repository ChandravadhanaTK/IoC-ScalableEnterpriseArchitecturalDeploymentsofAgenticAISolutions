"""Gmail Agent secure frontend. Run: py -m streamlit run web/app.py"""
import copy
import tempfile

import streamlit as st

from agents.batching import make_batches
from agents.classify import classify_batch
from agents.config import Config
from agents.llm import LLMError, make_llm_client
from agents.rules import DEFAULT_RULES, build_system_prompt, match_thread, validate_rules
from agents.score import candidate_threads_with_rules
from web.vault import SessionVault

st.set_page_config(page_title="Gmail Agent", layout="wide")
st.title("Gmail Agent — secure parsing console")

if "vault" not in st.session_state:
    st.session_state.vault = SessionVault()
if "rules" not in st.session_state:
    st.session_state.rules = copy.deepcopy(DEFAULT_RULES)
if "threads" not in st.session_state:
    st.session_state.threads = []

vault: SessionVault = st.session_state.vault

with st.sidebar:
    st.header("Session & secrets")
    st.caption("API key lives only in server memory. Never written to disk or logs. Wiped on End Session.")
    api_key = st.text_input("Gemini / Groq API key", type="password", value="", help="Kept in memory only.", key="api_key_input")
    col_a, col_b = st.columns(2)
    with col_a:
        if st.button("Save key"):
            try:
                vault.set_api_key(api_key)
                st.success("Key saved in memory.")
            except ValueError as e:
                st.error(str(e))
    with col_b:
        st.write(f"Key loaded: {'yes' if vault.has_key() else 'no'}")
    st.divider()
    st.header("Mailbox")
    up = st.file_uploader("Upload .mbox (Google Takeout)", type=["mbox"])
    if up is not None and st.button("Import .mbox"):
        from agents.mbox_importer import import_mbox
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".mbox")
        try:
            tmp.write(up.getvalue())
            tmp.close()
            vault.register_temp(tmp.name)
            threads = import_mbox(tmp.name)
            st.session_state.threads = threads
            st.success(f"Imported {len(threads)} thread(s). Temp file tracked for wipe.")
        except Exception as e:
            try:
                tmp.close()
            except Exception:
                pass
            try:
                vault.register_temp(tmp.name)
            except Exception:
                pass
            st.error(f"Import failed: {e}")
    st.divider()
    if st.button("End session (wipe key + temp files)", type="primary"):
        deleted = vault.wipe()
        st.session_state.rules = copy.deepcopy(DEFAULT_RULES)
        st.session_state.threads = []
        st.session_state.pop("results", None)
        st.session_state.pop("problems", None)
        for _k in [k for k in list(st.session_state.keys())
                   if k == "threshold" or k.startswith(("cl_", "cf_", "cm_", "cp_", "cw_", "cdel_", "kd_", "ke_", "kdel_", "new_", "api_key"))]:
            try:
                del st.session_state[_k]
            except KeyError:
                pass
        st.success(f"Session wiped. Deleted {len(deleted)} temp file(s).")
        st.rerun()

tab_criteria, tab_cats, tab_run = st.tabs(["Criteria", "Categories", "Run & Results"])
with tab_criteria:
    st.subheader("Parsing criteria (score = sum of matched weights)")
    st.slider("Candidate threshold", 0.0, 10.0, float(st.session_state.rules.get("threshold", 2.0)), 0.5, key="threshold")
    st.session_state.rules["threshold"] = float(st.session_state.threshold)
    for i, c in enumerate(list(st.session_state.rules["criteria"])):
        with st.expander(f"{c['id']} — {c.get('label','')}", expanded=False):
            c["label"] = st.text_input("Label", c.get("label", ""), key=f"cl_{i}")
            c["field"] = st.selectbox("Field", ["subject_and_body", "subject", "body", "from_email", "to_email"], index=["subject_and_body", "subject", "body", "from_email", "to_email"].index(c.get("field", "subject_and_body")), key=f"cf_{i}")
            c["match"] = st.selectbox("Match", ["regex", "contains", "exact", "corporate_domain"], index=["regex", "contains", "exact", "corporate_domain"].index(c.get("match", "regex")), key=f"cm_{i}")
            c["pattern"] = st.text_input("Pattern (empty for corporate_domain)", c.get("pattern", ""), key=f"cp_{i}")
            c["weight"] = st.number_input("Weight", 0.0, 10.0, float(c.get("weight", 1.0)), 0.5, key=f"cw_{i}")
            if st.button("Delete", key=f"cdel_{i}"):
                st.session_state.rules["criteria"].pop(i)
                st.rerun()
    with st.expander("Add criterion", expanded=False):
        nid = st.text_input("id (.HCMa-z0-9_)", key="new_cid")
        if st.button("Add"):
            st.session_state.rules["criteria"].append({"id": nid.strip(), "label": nid.strip(), "field": "subject_and_body", "match": "contains", "pattern": "", "weight": 1.0})
            errs = validate_rules(st.session_state.rules)
            if errs:
                st.session_state.rules["criteria"].pop()
                st.error("; ".join(errs))
            else:
                st.rerun()
    if st.button("Test criteria on loaded threads"):
        threads = st.session_state.threads
        if not threads:
            st.warning("Import an .mbox first.")
        else:
            hits = sum(1 for t in threads if match_thread(t, st.session_state.rules)[0] >= st.session_state.rules["threshold"])
            st.success(f"{hits} / {len(threads)} threads are candidates at threshold {st.session_state.rules['threshold']}.")
with tab_cats:
    st.subheader("Result categories (fully custom names allowed)")
    for i, cat in enumerate(list(st.session_state.rules["categories"])):
        with st.expander(cat["name"], expanded=False):
            cat["description"] = st.text_area("Description", cat.get("description", ""), key=f"kd_{i}")
            ex = "\n".join(cat.get("examples", []))
            ex_new = st.text_area("Examples (one per line)", ex, key=f"ke_{i}")
            cat["examples"] = [line for line in (ex_new.splitlines()) if line.strip()]
            if st.button("Delete", key=f"kdel_{i}"):
                st.session_state.rules["categories"].pop(i)
                st.rerun()
    with st.expander("Add category", expanded=False):
        nname = st.text_input("name (HCMa-z0-9_)", key="new_kname")
        ndesc = st.text_input("description", key="new_kdesc")
        if st.button("Add category"):
            st.session_state.rules["categories"].append({"name": nname.strip(), "description": ndesc.strip(), "examples": []})
            errs = validate_rules(st.session_state.rules)
            if errs:
                st.session_state.rules["categories"].pop()
                st.error("; ".join(errs))
            else:
                st.rerun()
    errs = validate_rules(st.session_state.rules)
    if errs:
        st.error("; ".join(errs))
    else:
        with st.expander("Preview classifier prompt", expanded=False):
            _cfg_preview = Config.load("config.yaml.example") if not vault.has_key() else Config.load("config.yaml")
            st.code(build_system_prompt(_cfg_preview.org_name, _cfg_preview.use_case, st.session_state.rules["categories"])[:2000])
with tab_run:
    st.subheader("Run pipeline (uses in-memory key only)")
    errs = validate_rules(st.session_state.rules)
    if errs:
        st.error("; ".join(errs))
    elif not st.session_state.threads:
        st.warning("Import an .mbox first.")
    elif not vault.has_key():
        st.warning("Save an API key in the sidebar first (memory only).")
    else:
        if st.button("Run scoring + classification"):
            key = vault.get_api_key()
            assert key, "key missing"
            cfg = Config.load("config.yaml")
            cands = candidate_threads_with_rules(st.session_state.threads, st.session_state.rules)
            st.write(f"Candidates: {len(cands)} / {len(st.session_state.threads)}")
            by_id = {t.thread_id: t for t in st.session_state.threads}
            idset = set(cands) if isinstance(next(iter(cands.values()), None), dict) else set(cands)
            cand_threads = [by_id[i] for i in idset if i in by_id]
            rules = st.session_state.rules
            client = None
            results, problems = [], []
            try:
                client = make_llm_client(cfg, api_key=key)
                for batch in make_batches(cand_threads, cfg):
                    valid, batch_problems = classify_batch(client, batch, cfg, rules=rules)
                    results.extend(valid)
                    problems.extend(batch_problems)
            except LLMError as e:
                st.error(f"LLM error: {e}")
            except Exception as e:
                st.error(f"Run failed: {e}")
            finally:
                try:
                    if client is not None:
                        try:
                            client.api_key = "x" * len(key or "")
                        except Exception:
                            pass
                        del client
                finally:
                    if key:
                        key = "x" * len(key)
            st.session_state["results"] = [c.to_dict() for c in results]
            st.session_state["problems"] = problems
            st.success(f"Classified {len(results)} thread(s), {len(problems)} problem(s). Key remains in memory only — End Session to wipe.")
    if st.session_state.get("results"):
        st.dataframe(st.session_state["results"])
        import pandas as pd
        df = pd.DataFrame(st.session_state["results"])
        st.download_button("Download CSV", df.to_csv(index=False).encode("utf-8-sig"), "results.csv", "text/csv")
    if st.session_state.get("problems"):
        with st.expander("Problems"):
            st.json(st.session_state["problems"])
