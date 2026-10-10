import os
from dotenv import load_dotenv
load_dotenv('E:\\Gmail Agent\\.env')

import sys
sys.path.insert(0, 'E:\\Gmail Agent')
from agents import llm
from agents.config import Config

cfg = Config(model='gemini-2.5-flash')
client = llm.make_llm_client(cfg)
print('OK: make_llm_client succeeded - real Gemini client created')
print(f'Client model: {client.model}')
print(f'Client api_key set: {bool(client.api_key)}')