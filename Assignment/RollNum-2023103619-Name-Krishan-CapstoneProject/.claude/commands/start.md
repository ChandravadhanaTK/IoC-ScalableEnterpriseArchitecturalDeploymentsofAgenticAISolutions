Start the full application stack (backend + frontend).

Steps:
1. Kill any processes already on ports 8000 and 3000.
2. Start the FastAPI backend with the test venv's uvicorn in the background:
   - Working directory: `backend/`
   - Command: `/tmp/chatbot-test-venv/bin/uvicorn main_sqlite:app --reload --port 8000`
   - If the venv doesn't exist, create it first:
     `~/.pyenv/versions/3.10.12/bin/python -m venv /tmp/chatbot-test-venv`
     then install: `/tmp/chatbot-test-venv/bin/pip install -r requirements_sqlite.txt beautifulsoup4 httpx`
3. Start the React frontend in the background:
   - Working directory: `frontend/`
   - Command: `npm start`
4. Wait ~3 seconds then verify the backend is healthy with `curl -s http://localhost:8000/`.
5. Report both URLs:
   - Backend: http://localhost:8000
   - Frontend: http://localhost:3000
