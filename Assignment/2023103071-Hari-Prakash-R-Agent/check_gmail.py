import sys
sys.path.insert(0, 'E:\Gmail Agent')
from agents.gmail_client import build_credentials, build_service

creds = build_credentials()
service = build_service(creds)

# List total messages in mailbox
result = service.users().stats().get(userId='me').execute()
print('Mailbox stats:', result)

# List total threads
threads = service.users().threads().list(userId='me', q='').execute()
total = len(threads.get('threads', []))
print(f'Total threads in mailbox: {total}')