import sys
sys.path.insert(0, 'E:\\Gmail Agent')
from agents.mbox_importer import import_mbox
threads = import_mbox('E:\\Gmail Agent\\tests\\fixtures\\sample_emails.jsonl')
print(f'Imported {len(threads)} threads')
if threads:
    t = threads[0]
    print(f'First thread: {t}')
    print(f'  thread_id: {t.thread_id}')
    print(f'  subject: {t.subject}')
    print(f'  messages: {len(t.messages)}')
    for m in t.messages:
        print(f'  msg: id={m.id}, from={m.from_email}, subject={m.subject}')