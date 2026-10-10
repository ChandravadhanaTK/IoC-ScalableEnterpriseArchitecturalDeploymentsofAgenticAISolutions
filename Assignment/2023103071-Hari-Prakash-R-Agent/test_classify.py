from agents.models import Classification
from agents import export

c = Classification(
    thread_id='t1', outcome='unrelated', confidence=0.5,
    direction='unknown', event='test', company='Test Company',
    company_normalized='test co', contact_person='Person',
    designation='Designation', email='a@b.com', phone='123',
    amount='100', amount_type='flat', in_kind_note='note',
    conversation_date='2026-01-01', evidence='evidence_id',
    evidence_message_id='msg123', parse_error=False
)
rows = export.classification_rows({'t1': c})
print('rows:', rows[:1])
print('columns:', export.CLASSIFICATION_COLUMNS)