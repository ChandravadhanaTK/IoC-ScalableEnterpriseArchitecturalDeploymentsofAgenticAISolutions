# Trip Planner Agent

An intelligent agentic assistant that autonomously plans personalized day trips based on user preferences, budget, location, and interests.

## 🎯 Overview

This project implements a complete agentic AI system that uses a **perceive→reason→act→observe** loop to:
- 🔍 Search for activities, restaurants, and points of interest
- 🎯 Filter results based on user constraints (budget, ratings)
- 🗺️ Optimize routes for minimal travel time and cost
- 📅 Generate comprehensive, time-stamped itineraries
- 📊 Export in multiple formats (Markdown, JSON, CSV)

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd TripPlannerAgent

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install -e .
```

### Basic Usage

```python
import asyncio
import sys
from pathlib import Path

# Make the flat src/ modules importable
sys.path.insert(0, str(Path(__file__).parent / "src"))

from datetime import datetime, timedelta
from agent import create_agent
from models import TripPreferences, ActivityCategory

async def main():
    # Create agent (use_mock=True for testing without API keys)
    agent = create_agent(use_mock=True)
    
    # Define preferences
    preferences = TripPreferences(
        location="San Francisco, CA",
        start_date=datetime.now() + timedelta(days=7),
        duration_days=1,
        budget=100.0,
        interests=[
            ActivityCategory.MUSEUM,
            ActivityCategory.RESTAURANT,
            ActivityCategory.PARK
        ],
        party_size=2
    )
    
    # Generate itinerary
    itinerary = await agent.plan_trip(preferences)
    
    # Display results
    print(itinerary.to_markdown())
    print(f"Total Cost: ${itinerary.total_cost:.2f}")
    
    await agent.close()

asyncio.run(main())
```

## 🌐 Local Web UI (offline)

Prefer a browser over the command line? The project ships with a small Flask
web app that runs **entirely on your machine** using the built-in mock data
(no API keys, no internet).

```bash
# 1. Install the web dependency (only extra package needed)
pip install flask

# 2. Start the server
python run_web.py
```

Then open **http://127.0.0.1:5000** in your browser.

On Windows you can also just double-click **`run_web.bat`**, which starts the
server and opens the browser for you.

**What the UI gives you:**

- A preferences form (destination, dates, budget, party size, interests,
  transportation, pace)
- A rendered day-by-day timeline showing times, costs, ratings and travel time
- A live summary (activities, total cost, budget used, average rating)
- Alternative activity suggestions
- **Copy as Markdown**, **Download .md**, and **Print** buttons

### Web app architecture

```
web_app/
├── app.py                 # Flask server + JSON API (/api/meta, /api/plan)
├── templates/index.html   # Single-page UI
└── static/
    ├── style.css          # Styling (responsive + print stylesheet)
    └── app.js             # Form handling + itinerary rendering (vanilla JS)
run_web.py                 # Launcher -> starts the server
run_web.bat                # Windows one-click launcher (opens browser)
```

The server binds to `127.0.0.1` only, so the site stays private to your machine.
It imports the same `src/` modules the CLI examples use, so any change to the
agent is reflected in the web UI automatically.

## 📁 Project Structure

```
TripPlannerAgent/
├── src/                    # Source code
│   ├── models.py          # Data models
│   ├── agent.py           # Main agent
│   ├── planner.py         # Itinerary planning
│   ├── searcher.py        # Activity search
│   ├── optimizer.py       # Route optimization
│   └── utils.py           # Utilities
├── web_app/                # Local offline web UI
│   ├── app.py             # Flask server + JSON API
│   ├── templates/         # index.html
│   └── static/            # style.css, app.js
├── tests/                  # Test suite
├── examples/               # Usage examples
├── docs/                   # Documentation
│   ├── prompt.md          # LLM generation prompt
│   └── DELIVERABLES.md    # Capstone deliverables
├── run_web.py             # Web UI launcher
├── run_web.bat            # Windows one-click launcher
├── requirements.txt
├── setup.py
└── README.md
```

## 📚 Documentation

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Architecture diagram of the implemented system (ASCII + Mermaid)
- **[docs/DELIVERABLES.md](docs/DELIVERABLES.md)** - Complete architecture documentation with 5 deliverables
- **[docs/prompt.md](docs/prompt.md)** - LLM prompt for application generation
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Developer guide and contribution guidelines

## 🧪 Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run examples
python examples/basic_usage.py
python examples/advanced_features.py

# Run only the web app tests
pytest tests/test_web_app.py

# Start the local web UI
python run_web.py
```

## ✨ Features

- Multi-category activity search
- Budget-aware optimization
- Route optimization (TSP heuristic)
- Time-slot scheduling
- Multi-format export (Markdown, JSON, CSV)
- Itinerary refinement with feedback
- Alternative activity suggestions
- **Local offline web UI** (Flask + vanilla JS, no external CDNs)

## 📊 Performance

- **Response Time**: <30 seconds
- **Success Rate**: >95%
- **Budget Compliance**: <5% variance
- **Test Coverage**: >80%

---

**Version**: 1.0.0 | **Status**: ✅ Production Ready