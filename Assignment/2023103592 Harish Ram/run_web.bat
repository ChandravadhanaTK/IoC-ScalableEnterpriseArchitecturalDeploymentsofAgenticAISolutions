@echo off
REM Launches the local Trip Planner web UI and opens it in the default browser.
cd /d "%~dp0"
start "" http://127.0.0.1:5000
python run_web.py
pause