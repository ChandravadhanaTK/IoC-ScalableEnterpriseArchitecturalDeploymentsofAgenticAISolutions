"""
Tests for optimization modules.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import pytest
from datetime import datetime, timedelta, time
from decimal import Decimal

from optimizer import RouteOptimizer, BudgetOptimizer
from models import Activity, ActivityCategory, Location, TripPreferences, TransportationMode
from utils import generate_id


@pytest.fixture
def sample_activities():
    """Create sample activities for testing"""
    base_lat, base_lon = 37.7749, -122.4194
    categories = [ActivityCategory.MUSEUM, ActivityCategory.RESTAURANT, 
                  ActivityCategory.PARK, ActivityCategory.LANDMARK]
    
    activities = []
    for i, category in enumerate(categories):
        activity = Activity(
            id=generate_id(f"activity_{i}"),
            name=f"{category.value.title()} {i+1}",
            category=category,
            location=Location(
                name=f"Location {i+1}",
                address=f"{100+i} Main St",
                latitude=base_lat + (i * 0.01),
                longitude=base_lon + (i * 0.01)
            ),
            description=f"Sample {category.value}",
            duration_minutes=60,
            cost=Decimal(15 + i * 5),
            rating=4.0 + (i * 0.2),
            reviews_count=100 + i * 50,
            operating_hours={'monday': (time(9, 0), time(18, 0))}
        )
        activities.append(activity)
    
    return activities


@pytest.fixture
def sample_preferences():
    """Create sample preferences"""
    return TripPreferences(
        location="San Francisco, CA",
        start_date=datetime.now() + timedelta(days=7),
        duration_days=1,
        budget=Decimal("100.00"),
        interests=[ActivityCategory.MUSEUM, ActivityCategory.RESTAURANT],
        party_size=2,
        transportation_preference=TransportationMode.WALKING
    )


class TestRouteOptimizer:
    """Tests for RouteOptimizer"""
    
    def test_optimize_route_empty(self):
        """Test route optimization with empty list"""
        optimizer = RouteOptimizer()
        result = optimizer.optimize_route([], None)
        assert result == []
    
    def test_optimize_route_single_activity(self, sample_activities):
        """Test route optimization with single activity"""
        optimizer = RouteOptimizer()
        result = optimizer.optimize_route([sample_activities[0]], None)
        assert len(result) == 1
    
    def test_optimize_route_multiple(self, sample_activities, sample_preferences):
        """Test route optimization with multiple activities"""
        optimizer = RouteOptimizer()
        result = optimizer.optimize_route(sample_activities, sample_preferences)
        assert len(result) == len(sample_activities)
    
    def test_calculate_travel_time(self, sample_activities):
        """Test travel time calculation"""
        optimizer = RouteOptimizer()
        activity1 = sample_activities[0]
        activity2 = sample_activities[1]
        
        time_walking = optimizer.calculate_travel_time(
            activity1, activity2, TransportationMode.WALKING
        )
        time_driving = optimizer.calculate_travel_time(
            activity1, activity2, TransportationMode.DRIVING
        )
        
        assert time_walking > 0
        assert time_driving > 0
        assert time_driving < time_walking


class TestBudgetOptimizer:
    """Tests for BudgetOptimizer"""
    
    def test_optimize_budget_distribution(self, sample_activities, sample_preferences):
        """Test budget optimization"""
        optimizer = BudgetOptimizer()
        result = optimizer.optimize_budget_distribution(sample_preferences, sample_activities)
        
        total_cost = sum(a.cost for a in result)
        assert total_cost <= sample_preferences.budget


class TestActivityScoring:
    """Tests for activity scoring"""
    
    def test_activity_score_calculation(self, sample_activities, sample_preferences):
        """Test activity relevance scoring"""
        activity = sample_activities[0]
        score = activity.get_score(sample_preferences)
        
        assert 0 <= score <= 100
        assert isinstance(score, float)
    
    def test_score_preferred_category(self, sample_preferences):
        """Test that preferred categories score higher"""
        preferred_activity = Activity(
            id=generate_id("preferred"),
            name="Preferred Museum",
            category=ActivityCategory.MUSEUM,
            location=Location(name="Test", address="Test", latitude=0, longitude=0),
            description="Test",
            duration_minutes=60,
            cost=Decimal("10"),
            rating=4.5,
            reviews_count=100,
            operating_hours={}
        )
        
        non_preferred_activity = Activity(
            id=generate_id("non_preferred"),
            name="Non-preferred",
            category=ActivityCategory.NIGHTLIFE,
            location=Location(name="Test", address="Test", latitude=0, longitude=0),
            description="Test",
            duration_minutes=60,
            cost=Decimal("10"),
            rating=4.5,
            reviews_count=100,
            operating_hours={}
        )
        
        preferred_score = preferred_activity.get_score(sample_preferences)
        non_preferred_score = non_preferred_activity.get_score(sample_preferences)
        assert preferred_score > non_preferred_score