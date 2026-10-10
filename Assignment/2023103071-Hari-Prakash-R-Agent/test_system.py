from agents.classify import CLASSIFY_SYSTEM
from agents.config import Config
c = Config()
system = CLASSIFY_SYSTEM(c)
# Write to file to avoid encoding issues
with open('system_prompt.txt', 'w', encoding='utf-8') as f:
    f.write(system)
print('Written system prompt to system_prompt.txt')
print('Length:', len(system))