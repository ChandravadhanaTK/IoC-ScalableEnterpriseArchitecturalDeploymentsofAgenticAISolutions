import sys
sys.path.insert(0, 'E:\\Gmail Agent')

from agents.store import load_threads, save_threads
from agents.config import Config
from agents.classify import classify_all
from agents.llm import FakeLLMClient
from agents.score import candidate_threads
import json, os

cfg = Config()
threads = load_threads('E:\\Gmail Agent\\evidence\\raw\\emailstore.jsonl')
candidates = candidate_threads(threads, cfg)
print(f'Candidates: {list(candidates.keys())}')

SCRIPT = {
    't1': {'outcome': 'positive', 'confidence': 0.95, 'direction': 'company_to_csea',
           'event': 'CSEA Symposium 2024', 'company': 'ABC Technologies',
           'company_normalized': 'abc technologies', 'contact_person': 'Rahul Kumar',
           'designation': 'HR Manager', 'email': 'rahul@abctech.com',
           'phone': '+91 9876543210', 'amount': '₹25,000', 'amount_type': 'money',
           'in_kind_note': None, 'conversation_date': '2024-09-15',
           'evidence': 'We are happy to sponsor your event.', 'evidence_message_id': 't1m1'},
    't2': {'outcome': 'completed', 'confidence': 0.9, 'direction': 'company_to_csea',
           'event': 'CSEA Symposium 2024', 'company': 'Payments Gateway Inc',
           'company_normalized': 'payments gateway', 'contact_person': 'Accounts',
           'designation': None, 'email': 'paymentsgateway@payments.com', 'phone': None,
           'amount': 'Rs 25,000', 'amount_type': 'money', 'in_kind_note': None,
           'conversation_date': '2024-09-30', 'evidence': 'Payment processed.',
           'evidence_message_id': 't2m1'},
    't3': {'outcome': 'negotiation', 'confidence': 0.8, 'direction': 'company_to_csea',
           'event': 'CSEA Hackathon 2023', 'company': 'Wipro',
           'company_normalized': 'wipro', 'contact_person': None, 'designation': None,
           'email': 'contact@wipro.com', 'phone': None, 'amount': 'Rs 10,000',
           'amount_type': 'money', 'in_kind_note': None, 'conversation_date': '2023-03-10',
           'evidence': 'We can sponsor Rs 10,000.', 'evidence_message_id': 't3m1'},
    't6': {'outcome': 'positive', 'confidence': 0.85, 'direction': 'csea_to_company',
           'event': 'CSEA Tech Quiz 2020', 'company': 'Acme',
           'company_normalized': 'acme', 'contact_person': None, 'designation': None,
           'email': 'hello@acme.co.in', 'phone': None, 'amount': None,
           'amount_type': 'in_kind', 'in_kind_note': 'logo placement', 'conversation_date': '2020-02-12',
           'evidence': 'Yes, we would like to sponsor the quiz.', 'evidence_message_id': 't6m2'},
    't4': {'outcome': 'interested_uncommitted', 'confidence': 0.6, 'direction': 'company_to_csea',
           'event': None, 'company': 'XYZ Corp', 'company_normalized': 'xyz corp',
           'contact_person': 'Priya', 'designation': None, 'email': 'priya@xyzcorp.in',
           'phone': None, 'amount': None, 'amount_type': None, 'in_kind_note': None,
           'conversation_date': '2022-06-01', 'evidence': 'We will discuss internally.',
           'evidence_message_id': 't4m1'},
    't5': {'outcome': 'negative', 'confidence': 0.9, 'direction': 'company_to_csea',
           'event': None, 'company': 'Small Bank', 'company_normalized': 'small bank',
           'contact_person': None, 'designation': None, 'email': 'info@smallbank.in',
           'phone': None, 'amount': None, 'amount_type': None, 'in_kind_note': None,
           'conversation_date': '2021-01-20', 'evidence': 'We cannot sponsor this year.',
           'evidence_message_id': 't5m1'},
    't8': {'outcome': 'no_response', 'confidence': 0.7, 'direction': 'csea_to_company',
           'event': 'National Conference 2015', 'company': None, 'company_normalized': None,
           'contact_person': None, 'designation': None, 'email': 'events@univ.edu',
           'phone': None, 'amount': None, 'amount_type': None, 'in_kind_note': None,
           'conversation_date': '2015-02-01', 'evidence': 'No reply received.', 'evidence_message_id': 't8m1'},
}

def _parse_payload(text):
    start = text.find('[')
    end = text.rfind(']')
    if start == -1 or end == -1:
        raise AssertionError('prompt payload has no JSON array')
    return json.loads(text[start:end + 1])

def _scripted_classify_handler(script):
    def handler(prompt, system):
        payload = _parse_payload(prompt)
        results = []
        for item in payload:
            tid = item.get('thread_id')
            if tid not in script:
                continue
            template = dict(script[tid])
            template['index'] = payload.index(item)
            results.append(template)
        return results
    return handler

client = FakeLLMClient('x', handler=_scripted_classify_handler(SCRIPT))

classify_all(
    client,
    [t for t in threads if t.thread_id in candidates],
    cfg,
    'E:\\Gmail Agent\\evidence\\state\\classifications.json',
    'E:\\Gmail Agent\\evidence\\state\\problems.json',
)
print(' classify_all completed')

cls_path = 'E:\\Gmail Agent\\evidence\\state\\classifications.json'
print(f'Classifications file exists: {os.path.exists(cls_path)}')
if os.path.exists(cls_path):
    with open(cls_path) as f:
        data = json.load(f)
    print(f'Classification keys: {list(data.keys())}')