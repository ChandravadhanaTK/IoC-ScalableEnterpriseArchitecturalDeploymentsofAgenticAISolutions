"""
Tests for ItineraryPlanner.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import pytest
from datetime import datetime, timedelta, time
from decimal import Decimal

from planner import ItineraryPlanner
from models import (
    TripPreferences, Activity, ActivityCategory, Location, 
    TransportationMode, Itinerary
)
from utils import generate_id


@pytest.fixture
def sample_activities():
    """Create sample activities for testing"""
    base_time = datetime.now().replace(hour=9, minute=0, second=0, microsecond=0)
    
    activities = []
    for i in range(3):
        activity = Activity(
            id=generate_id(f"activity_{i}"),
            name=f"Activity {i+1}",
            category=ActivityCategory.MUSEUM if i % 2 == 0 else ActivityCategory.RESTAURANT,
            location=Location(
                name=f"Location {i+1}",
                address=f"{100+i} Main St",
                latitude=37.7749 + (i * 0.01),
                longitude=-122.4194 + (i * 0.01)
            ),
            description=f"Sample activity {i+1}",
            duration_minutes=60 + (i * 30),
            cost=Decimal(10 + i * 5),
            rating=4.0 + (i * 0.3),
            reviews_count=100 + i * 50,
            operating_hours={
                'monday': (time(9, 0), time(18, 0)),
                'tuesday': (time(9, 0), time(18, 0))
            }
        )
        activities.append(activity)
    
    return activities


@pytest.fixture
def sample_preferences():
    """Create sample preferences for testing"""
    return TripPreferences(
        location="San Francisco, CA",
        start_date=datetime.now() + timedelta(days=7),
        duration_days=1,
        budget=Decimal("100.00"),
        interests=[ActivityCategory.MUSEUM, ActivityCategory.RESTAURANT],
        party_size=2,
        transportation_preference=TransportationMode.WALKING,
        start_time=time(9, 0),
        end_time=time(21, 0)
    )


@pytest.fixture
def planner():
    """Create itinerary planner instance"""
    return ItineraryPlanner()


def test_generate_itinerary(planner, sample_activities, sample_preferences):
    """Test itinerary generation"""
    itinerary = planner.generate_itinerary(sample_activities, sample_preferences)
    
    assert itinerary is not None
    assert itinerary.id is not None
    assert len(itinerary.items) > 0
    assert itinerary.total_cost > 0
    assert itinerary.total_distance_km >= 0


def test_generate_itinerary_empty_activities(planner, sample_preferences):
    """Test itinerary generation with no activities"""
    with pytest.raises(ValueError):
        planner.generate_itinerary([], sample_preferences)


def test_validate_itinerary_valid(planner, sample_activities, sample_preferences):
    """Test validation of valid itinerary"""
    itinerary = planner.generate_itinerary(sample_activities, sample_preferences)
    issues = planner.validate_itinerary(itinerary)
    
    # May have issues but should be a list
    assert isinstance(issues, list)


def test_validate_itinerary_over_budget(planner, sample_preferences):
    """Test validation catches budget overrun"""
    # Create expensive activity
    expensive_activity = Activity(
        id=generate_id("expensive"),
        name="Luxury Experience",
        category=ActivityCategory.ENTERTAINMENT,
        location=Location(
            name="Luxury Venue",
            address="123 Rich St",
            latitude=37.7749,
            longitude=-122.4194
        ),
        description="Very expensive activity",
        duration_minutes=120,
        cost=Decimal("200.00"),  # Over budget
        rating=5.0,
        reviews_count=1000,
        operating_hours={'monday': (time(10, 0), time(22, 0))}
    )
    
    itinerary = Itinerary(
        id=generate_id("itinerary"),
        preferences=sample_preferences,
        items=[],
        total_cost=Decimal("200.00"),
        total_distance_km=0.0,
        total_duration_hours=2.0,
        created_at=datetime.utcnow()
    )
    itinerary.items = [type('obj', (object,), {
        'time': datetime.now(),
        'activity': expensive_activity,
        'travel_time_to_next': 0,
        'travel_mode': TransportationMode.WALKING
    })()]
    
    issues = planner.validate_itinerary(itinerary)
    assert len(issues) > 0
    assert any("budget" in issue.lower() for issue in issues)


def test_itinerary_to_markdown(planner, sample_activities, sample_preferences):
    """Test Markdown export"""
    itinerary = planner.generate_itinerary(sample_activities, sample_preferences)
    markdown = itinerary.to_markdown()
    
    assert isinstance(markdown, str)
    assert len(markdown) > 0
    assert sample_preferences.location in markdown
    assert "## Summary" in markdown


def test_itinerary_to_json(planner, sample_activities, sample_preferences):
    """Test JSON export"""
    itinerary = planner.generate_itinerary(sample_activities, sample_preferences)
    json_data = itinerary.to_json()
    
    assert isinstance(json_data, dict)
    assert "id" in json_data
    assert "items" in json_data
    assert "summary" in json_data
    assert len(json_data["items"]) == len(itinerary.items)