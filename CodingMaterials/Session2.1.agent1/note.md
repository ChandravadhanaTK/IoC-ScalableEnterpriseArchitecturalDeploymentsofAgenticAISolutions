$env:OPENAI_API_KEY="sk-your-actual-openai-key"
$env:TAVILY_API_KEY="tvly-your-actual-tavily-key"


# Run Agent 1 (Writer & Critic loop)
& "d:/develop/learnpython/venv/python.exe" d:/develop/agent1/app.py

# Run Agent 2 (Supervisor, SearchAgent, WriterAgent, CriticAgent)
& "d:/develop/learnpython/venv/python.exe" d:/develop/agent2/app.py
