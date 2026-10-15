import os, sys, tempfile, json
sys.path.insert(0, 'E:\\Gmail Agent')
from phase1_fetch import main
from agents import store
from email.message import EmailMessage
import mailbox

tmp_path = tempfile.mkdtemp()
mpath = os.path.join(tmp_path, 'in.mbox')
box = mailbox.mbox(mpath)
m = EmailMessage()
m['Subject'] = 'Sponsorship'
m['Message-ID'] = '<m1@x>'
m['From'] = 'rahul@abctech.com'
m['Date'] = 'Mon, 02 Sep 2024 10:00:00 +0000'
m.set_content('We are happy to sponsor.')
box.add(m)
box.close()

main(['--source', 'mbox', '--mbox', mpath, '--evidence-dir', tmp_path])

# List all files
print('=== Files in tmp_path ===')
for root, dirs, files in os.walk(tmp_path):
    for f in files:
        full = os.path.join(root, f)
        print(f'  {full}')
        if f.endswith('.jsonl'):
            with open(full) as fh:
                print(f'    lines: {len(fh.readlines())}')

# Check store state
print(f'\\nStore DEFAULT emailstore: {store.DEFAULT_PATHS["emailstore"]}')
print(f'Store loaded from default: {len(store.load_threads(store.DEFAULT_PATHS["emailstore"]))}')

# Check the specific path
spec_path = os.path.join(tmp_path, 'evidence', 'raw', 'emailstore.jsonl')
print(f'\\nSpec path: {spec_path}')
print(f'Spec path exists: {os.path.exists(spec_path)}')
if os.path.exists(spec_path):
    with open(spec_path) as f:
        print(f'Spec file lines: {len(fh.readlines()) if "fh" in dir() else "N/A"}')