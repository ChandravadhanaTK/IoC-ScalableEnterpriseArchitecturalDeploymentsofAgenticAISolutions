from agents.llm import FakeLLMClient
c = FakeLLMClient()
print('FakeLLMClient created:', type(c))
# Try a simple generate
result = c.generate("Classify: unrelated", system="You are a classifier")
print('Result:', result)
PYEOF