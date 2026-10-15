"""
Convenience launcher for the local Trip Planner web UI.

Usage:
    python run_web.py

Then open http://127.0.0.1:5000 in your browser.
"""

import sys
from pathlib import Path

# Make web_app importable
WEB_APP_DIR = Path(__file__).resolve().parent / "web_app"
sys.path.insert(0, str(WEB_APP_DIR))

from app import main  # noqa: E402

if __name__ == "__main__":
    main()