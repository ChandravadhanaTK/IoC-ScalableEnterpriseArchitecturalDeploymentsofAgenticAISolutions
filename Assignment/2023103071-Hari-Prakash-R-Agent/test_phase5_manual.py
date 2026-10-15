import sys, os, json
sys.path.insert(0, 'E:\\Gmail Agent')
import tempfile
from pathlib import Path
from agents import store, score
from agents.classify import classify_all
from agents.llm import FakeLLMClient
from agents.config import Config

SCRIPT = {
    "t1": {"outcome": "positive", "confidence": 0.95, "direction": "company_to_csea",
           "event": "CSEA Symposium 2024", "company": "ABC Technologies",
           "company_normalized": "abc technologies", "contact_person": "Rahul Kumar",
           "designation": "HR Manager", "email": "rahul@abctech.com",
           "phone": "+91 9876543210", "amount": "₹25,000", "amount_type": "money",
           "in_kind_note": None, "conversation_date": "2024-09-15",
           "evidence": "We are happy to sponsor your event.", "evidence_message_id": "t1m1"},
    "t2": {"outcome": "completed", "confidence": 0.9, "direction": "company_to_csea",
           "event": "CSEA Symposium 2024", "company": "Payments Gateway Inc",
           "company_normalized": "payments gateway", "contact_person": "Accounts",
           "designation": None, "email": "paymentsgateway@payments.com", "phone": None,
           "amount": "Rs 25,000", "amount_type": "money", "in_kind_note": None,
           "conversation_date": "2024-09-30", "evidence": "Payment processed.",
           "evidence_message_id": "t2m1"},
    "t3": {"outcome": "negotiation", "confidence": 0.8, "direction": "company_to_csea",
           "event": "CSEA Hackathon 2023", "company": "Wipro",
           "company_normalized": "wipro", "contact_person": None, "designation": None,
           "email": "contact@wipro.com", "phone": None, "amount": "Rs 10,000",
           "amount_type": "money", "in_kind_note": None, "conversation_date": "2023-03-10",
           "evidence": "We can sponsor Rs 10,000.", "evidence_message_id": "t3m1"},
    "t6": {"outcome": "positive", "confidence": 0.85, "direction": "csea_to_company",
           "event": "CSEA Tech Quiz 2020", "company": "Acme",
           "company_normalized": "acme", "contact_person": None, "designation": None,
           "email": "hello@acme.co.in", "phone": None, "amount": None,
           "amount_type": "in_kind", "in_kind_note": "logo placement", "conversation_date": "2020-02-12",
           "evidence": "Yes, we would like to sponsor the quiz.", "evidence_message_id": "t6m2"},
    "t4": {"outcome": "interested_uncommitted", "confidence": 0.6, "direction": "company_to_csea",
           "event": None, "company": "XYZ Corp", "company_normalized": "xyz corp",
           "contact_person": "Priya", "designation": None, "email": "priya@xyzcorp.in",
           "phone": None, "amount": None, "amount_type": None, "in_kind_note": None,
           "conversation_date": "2022-06-01", "evidence": "We will discuss internally.",
           "evidence_message_id": "t4m1"},
    "t5": {"outcome": "negative", "confidence": 0.9, "direction": "company_to_csea",
           "event": None, "company": "Small Bank", "company_normalized": "small bank",
           "contact_person": None, "designation": None, "email": "info@smallbank.in",
           "phone": None, "amount": None, "amount_type": None, "in_kind_note": None,
           "conversation_date": "2021-01-20", "evidence": "We cannot sponsor this year.",
           "evidence_message_id": "t5m1"},
    "t8": {"outcome": "no_response", "confidence": 0.7, "direction": "csea_to_company",
           "event": "National Conference 2015", "company": None, "company_normalized": None,
           "contact_person": None, "designation": None, "email": "events@univ.edu",
           "phone": None, "amount": None, "amount_type": None, "in_kind_note": None,
           "conversation_date": "2015-02-01", "evidence": "No reply received.", "evidence_message_id": "t8m1"},
}

def _parse_payload(text):
    start = text.find("[")
    end = text.rfind("]")
    if start == -1 or end == -1:
        raise AssertionError("prompt payload has no JSON array")
    return json.loads(text[start:end + 1])

def _scripted_classify_handler(script):
    def handler(prompt, system):
        payload = _parse_payload(prompt)
        results = []
        for item in payload:
            tid = item.get("thread_id")
            if tid not in script:
                continue
            template = dict(script[tid])
            template["index"] = payload.index(item)
            results.append(template)
        return results
    return handler

tmpDir = tempfile.mkdtemp()
tmp_path = Path(tmpDir)
ev = tmp_path / 'evidence'
ev_raw = ev / 'raw'
ev_raw.mkdir(parents=True, exist_ok=True)

from agents import store
store.save_threads(store.load_threads('E:\\Gmail Agent\\tests\\fixtures\\sample_emails.jsonl'), ev_raw / 'emailstore.jsonl')

cfg = Config()
client = FakeLLMClient('x', handler=_scripted_classify_handler(SCRIPT))
all_threads = store.load_threads('E:\\Gmail Agent\\tests\\fixtures\\sample_emails.jsonl')
threads_to_classify = [t for t in all_threads if t.thread_id in SCRIPT]
classify_all(
    client,
    threads_to_classify,
    cfg,
    ev / 'state' / 'classifications.json',
    ev / 'state' / 'problems.json',
)

from phase5_build import main
out_dir = Path(tempfile.mkdtemp())
main(['--evidence-dir', str(ev), '--output-dir', str(out_dir)])

print('out dir exists:', out_dir.exists())
print('review_sheet exists:', (out_dir / 'review_sheet.xlsx').exists())
print('sponsorship_crm exists:', (out_dir / 'sponsorship_crm.xlsx').exists())
print('sponsorship_history exists:', (out_dir / 'sponsorship_history.csv').exists())
print('sponsorship_crm.csv exists:', (out_dir / 'sponsorship_crm.csv').exists())

if (out_dir / 'sponsorship_crm.csv').exists():
    import pandas as pd
    crm = pd.read_csv(out_dir / 'sponsorship_crm.csv')
    print('CRM thread IDs:', set(crm['thread_id']))
    print('CRM rows:', len(crm))
    
hist = pd.read_csv(out_dir / 'sponsorship_history.csv')
print('History rows:', len(hist))
print('History:', hist.to_dict('records'))