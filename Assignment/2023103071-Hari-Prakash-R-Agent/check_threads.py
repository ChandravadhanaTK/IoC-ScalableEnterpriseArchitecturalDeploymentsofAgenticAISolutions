import sys
sys.path.insert(0, 'E:\\\\Gmail Agent')
from agents.gmail_client import build_credentials, build_service

creds = build_credentials()
service = build_service(creds)

threads1 = service.users().threads().list(userId='me', q='').execute()
t1 = len(threads1.get('threads', []))

threads2 = service.users().threads().list(userId='me', q='in:anymail').execute()
t2 = len(threads2.get('threads', []))

threads3 = service.users().threads().list(userId='me', q='in:inbox').execute()
t3 = len(threads3.get('threads', []))

print('q="": ' + str(t1) + ' threads')
print('q="in:anymail": ' + str(t2) + ' threads')
print('q="in:inbox": ' + str(t3) + ' threads')