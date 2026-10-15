"""
Local web server for the Trip Planner Agent.

This Flask app wraps the existing agent package in a simple browser UI.
It runs completely offline using the built-in MockActivitySearcher, so no
API keys or internet connection are required.

Run with:   python web_app/app.py
Then open:  http://127.0.0.1:5000
"""

import asyncio
import sys
import logging
from datetime import datetime, timedelta, time as dt_time
from pathlib import Path
from decimal import Decimal

# Make the src/ modules importable (flat imports, same as examples/tests)
SRC_DIR = Path(__file__).resolve().parent.parent / "src"
sys.path.insert(0, str(SRC_DIR))

from flask import Flask, render_template, request, jsonify

from agent import create_agent
from models import TripPreferences, ActivityCategory, TransportationMode

app = Flask(__name__)

# Keep the console quiet - the agent logs a lot at INFO level
for _name in ("agent", "optimizer", "planner", "searcher", "utils"):
    logging.getLogger(_name).setLevel(logging.WARNING)


def _serialize_itinerary(itinerary) -> dict:
    """Convert an Itinerary object into a JSON-serializable dictionary."""
    items = []
    for idx, item in enumerate(itinerary.items, 1):
        end_time = item.time + timedelta(minutes=item.activity.duration_minutes)
        items.append({
            "index": idx,
            "name": item.activity.name,
            "category": item.activity.category.value,
            "description": item.activity.description,
            "time": item.time.strftime("%I:%M %p"),
            "end_time": end_time.strftime("%I:%M %p"),
            "duration_minutes": item.activity.duration_minutes,
            "cost": float(item.activity.cost),
            "rating": item.activity.rating,
            "reviews_count": item.activity.reviews_count,
            "location": item.activity.location.name,
            "address": item.activity.location.address,
            "travel_time_to_next": item.travel_time_to_next,
            "travel_mode": item.travel_mode.value,
        })

    alternatives = [
        {
            "name": a.name,
            "category": a.category.value,
            "cost": float(a.cost),
            "rating": a.rating,
        }
        for a in itinerary.alternative_suggestions
    ]

    summary = itinerary.get_summary()

    return {
        "id": itinerary.id,
        "location": itinerary.preferences.location,
        "start_date": itinerary.preferences.start_date.strftime("%Y-%m-%d"),
        "duration_days": itinerary.preferences.duration_days,
        "budget": float(itinerary.preferences.budget),
        "total_cost": float(itinerary.total_cost),
        "total_distance_km": round(itinerary.total_distance_km, 2),
        "total_duration_hours": round(itinerary.total_duration_hours, 2),
        "total_activities": summary["total_activities"],
        "average_rating": summary["average_rating"],
        "categories_covered": [
            getattr(c, "value", str(c)) for c in summary["categories_covered"]
        ],
        "items": items,
        "alternatives": alternatives,
        "markdown": itinerary.to_markdown(),
    }


def _parse_time(value, default: str = "09:00") -> dt_time:
    """Parse a time string into a datetime.time, with a safe fallback."""
    if not value:
        value = default
    for fmt in ("%H:%M", "%I:%M %p", "%I:%M%p", "%H:%M:%S"):
        try:
            return datetime.strptime(value, fmt).time()
        except ValueError:
            continue
    return dt_time(9, 0)


def _build_preferences(data: dict) -> TripPreferences:
    """Build a validated TripPreferences object from raw request data."""
    location = (data.get("location") or "").strip()
    if not location:
        raise ValueError("A destination location is required.")

    # Start date (must be in the future per the model validator)
    date_str = (data.get("start_date") or "").strip()
    if date_str:
        try:
            start_date = datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            raise ValueError("Start date must be in YYYY-MM-DD format.")
    else:
        start_date = datetime.now() + timedelta(days=7)

    if start_date < datetime.now():
        start_date = datetime.now() + timedelta(days=1)

    duration_days = max(1, min(14, int(data.get("duration_days", 1))))
    party_size = max(1, min(20, int(data.get("party_size", 1))))

    try:
        budget = Decimal(str(data.get("budget", 100)))
    except Exception:
        raise ValueError("Budget must be a number.")
    if budget < 0:
        raise ValueError("Budget cannot be negative.")

    # Interests
    raw_interests = data.get("interests") or []
    if isinstance(raw_interests, str):
        raw_interests = [raw_interests]
    interests = []
    for value in raw_interests:
        try:
            interests.append(ActivityCategory(value))
        except ValueError:
            continue
    if not interests:
        interests = [ActivityCategory.MUSEUM, ActivityCategory.RESTAURANT]

    # Transportation
    try:
        transport = TransportationMode(data.get("transportation", "walking"))
    except ValueError:
        transport = TransportationMode.WALKING

    pace = data.get("pace", "moderate")
    if pace not in ("relaxed", "moderate", "packed"):
        pace = "moderate"

    return TripPreferences(
        location=location,
        start_date=start_date,
        duration_days=duration_days,
        budget=budget,
        interests=interests,
        party_size=party_size,
        transportation_preference=transport,
        start_time=_parse_time(data.get("start_time"), "09:00"),
        end_time=_parse_time(data.get("end_time"), "21:00"),
        pace=pace,
    )


async def _plan_async(preferences: TripPreferences):
    """Run the agent end-to-end for a single set of preferences."""
    agent = create_agent(use_mock=True, log_level="WARNING")
    try:
        return await agent.plan_trip(preferences)
    finally:
        await agent.close()


@app.route("/")
def index():
    """Serve the single-page UI."""
    return render_template("index.html")


@app.route("/api/meta")
def meta():
    """Expose the valid option values so the UI can build its form."""
    return jsonify({
        "interests": [c.value for c in ActivityCategory],
        "transportation": [t.value for t in TransportationMode],
        "paces": ["relaxed", "moderate", "packed"],
    })


@app.route("/api/plan", methods=["POST"])
def plan():
    """Plan a trip and return the itinerary as JSON."""
    data = request.get_json(force=True, silent=True) or {}

    try:
        preferences = _build_preferences(data)
    except (ValueError, TypeError) as exc:
        return jsonify({"error": str(exc)}), 400

    try:
        itinerary = asyncio.run(_plan_async(preferences))
    except Exception as exc:  # noqa: BLE001 - surface message to the UI
        app.logger.error("Planning failed: %s", exc, exc_info=True)
        return jsonify({"error": f"Planning failed: {exc}"}), 500

    return jsonify(_serialize_itinerary(itinerary))


def main():
    """Start the local development server."""
    host = "127.0.0.1"
    port = 5000
    banner = (
        "\n" + "=" * 56 + "\n"
        "  Trip Planner Agent - Local Web UI\n"
        "  Running fully offline (mock data, no API keys)\n"
        f"  Open your browser at:  http://{host}:{port}\n"
        "  Press CTRL+C to stop the server\n"
        + "=" * 56 + "\n"
    )
    print(banner)
    app.run(host=host, port=port, debug=False)


if __name__ == "__main__":
    main()
