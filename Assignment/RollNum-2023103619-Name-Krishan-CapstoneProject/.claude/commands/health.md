Check the health of the running application stack.

Steps:
1. Check the backend: `curl -s http://localhost:8000/`
   - If it returns `{"status":"healthy"}`, report backend OK.
   - If it fails, report backend is down.
2. Check the frontend: verify port 3000 has a listening process via `lsof -ti:3000`.
   - If a process is found, report frontend OK.
   - If not, report frontend is down.
3. Check the API docs are reachable: `curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/docs`
   - 200 → docs OK.
4. Print a concise status table:
   | Service  | Status | URL |
   |----------|--------|-----|
   | Backend  | ...    | http://localhost:8000 |
   | Frontend | ...    | http://localhost:3000 |
   | API Docs | ...    | http://localhost:8000/docs |
