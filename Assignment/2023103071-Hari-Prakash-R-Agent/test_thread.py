import json
from agents.models import Thread
t = Thread(
    thread_id='test1',
    subject='test subject',
)
# Print all fields
for f in Thread.__dataclass_fields__:
    print(f, getattr(t, f, 'N/A'))