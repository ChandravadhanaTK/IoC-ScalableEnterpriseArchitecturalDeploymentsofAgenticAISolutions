"""
Trip Planner Agent - Intelligent agentic assistant for trip planning.

This package provides a complete agentic AI system that autonomously
plans personalized day trips based on user preferences.
"""

__version__ = "1.0.0"
__author__ = "Trip Planner Agent Team"
__email__ = "support@tripplanner.ai"

from src.models import (
    TripPreferences,
    Activity,
    ItineraryItem,
    Itinerary,
    ActivityCategory,
    TransportationMode
)

__all__ = [
    "TripPreferences",
    "Activity",
    "ItineraryItem",
    "Itinerary",
    "ActivityCategory",
    "TransportationMode"
]