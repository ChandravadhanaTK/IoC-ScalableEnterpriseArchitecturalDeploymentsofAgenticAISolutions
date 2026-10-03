Stop the application stack (backend + frontend).

Steps:
1. Kill all processes on ports 8000 and 3000 using `lsof -ti:8000,3000 | xargs kill`.
2. Also kill by process name as a fallback:
   - `pkill -f "uvicorn main_sqlite"` (backend)
   - `pkill -f "react-scripts start"` (frontend)
3. Confirm both ports are free (no output from `lsof -ti:8000,3000`).
4. Report that the stack has been stopped.
