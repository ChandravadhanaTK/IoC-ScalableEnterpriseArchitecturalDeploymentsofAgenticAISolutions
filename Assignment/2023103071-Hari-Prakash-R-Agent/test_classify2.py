from agents.classify import CLASSIFY_SYSTEM, build_classify_prompt
from agents.config import Config
from agents.models import Thread

cfg = Config()
t = Thread(
    thread_id='test1',
    subject='CSEA_CEG shared a post: Event Learning Partner — GUVI x HCL | Abacus \'26\'',
    full_text='CSEA_CEG shared a post: Event Learning Partner — GUVI x HCL | Abacus \'26\'\nWe are excited to announce GUVI as our Event Learning Partner for Abacus \'26! This partnership will enable...',
    messages=[],
    date='2025-01-01',
    first_date='2025-01-01',
    last_date='2025-01-01',
    direction_hint='unknown',
    company='',
    company_normalized='',
    contact_person='',
    designation='',
    email='',
    phone='',
    amount='',
    amount_type='',
    in_kind_note='',
    parse_error=False,
    evidence='',
    evidence_message_id=''
)
system = CLASSIFY_SYSTEM(cfg)
prompt = build_classify_prompt([t], cfg)
print('System prompt (first 300 chars):')
print(system[:300])
print()
print('Prompt (first 300 chars):')
print(prompt[:300])