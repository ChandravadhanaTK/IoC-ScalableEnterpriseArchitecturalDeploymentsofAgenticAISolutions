from agents.models import Classification

d = {
    'thread_id': 't1', 'outcome': 'unrelated', 'confidence': 0.5,
    'direction': 'unknown', 'event': 'test', 'company': 'Test',
    'company_normalized': 'test co', 'contact_person': 'Person',
    'designation': 'Designation', 'email': 'a@b.com', 'phone': '123',
    'amount': '100', 'amount_type': 'flat', 'in_kind_note': 'note',
    'conversation_date': '2026-01-01', 'evidence': 'evidence_id',
    'evidence_message_id': 'msg123', 'parse_error': False
}
c = Classification(**d)
print('created:', type(c))
print('fields:', c.thread_id, c.outcome)
PYEOF