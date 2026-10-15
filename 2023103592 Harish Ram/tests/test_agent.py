"""
Tests for TripPlannerAgent.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import pytest
import asyncio
from datetime import datetime, timedelta
from decimal import Decimal

from agent import TripPlannerAgent, create_agent
from models import TripPreferences, ActivityCategory, TransportationMode
from utils import generate_id, format_duration, validate_budget


@pytest.fixture
def sample_preferences():
    """Create sample trip preferences for testing"""
    return TripPreferences(
        location="San Francisco, CA",
        start_date=datetime.now() + timedelta(days=7),
        duration_days=1,
        budget=Decimal("100.00"),
        interests=[ActivityCategory.MUSEUM, ActivityCategory.RESTAURANT],
        party_size=2,
        transportation_preference=TransportationMode.WALKING
    )


@pytest.fixture
def mock_agent():
    """Create a mock agent for testing"""
    return create_agent(use_mock=True, log_level="WARNING")


@pytest.mark.asyncio
async def test_agent_initialization():
    """Test agent initialization"""
    agent = create_agent(use_mock=True)
    assert agent is not None
    assert agent.state.value == "idle"
    await agent.close()


@pytest.mark.asyncio
async def test_plan_trip_basic(mock_agent, sample_preferences):
    """Test basic trip planning"""
    itinerary = await mock_agent.plan_trip(sample_preferences)
    
    assert itinerary is not None
    assert itinerary.id is not None
    assert len(itinerary.items) > 0
    assert itinerary.total_cost > 0


@pytest.mark.asyncio
async def test_agent_state_transitions(mock_agent, sample_preferences):
    """Test agent state transitions during planning"""
    initial_state = mock_agent.state
    assert initial_state.value == "idle"
    
    task = asyncio.create_task(mock_agent.plan_trip(sample_preferences))
    await asyncio.sleep(0.1)
    
    assert mock_agent.state.value != "idle"
    await task
    assert mock_agent.state.value == "completed"


@pytest.mark.asyncio
async def test_refine_itinerary(mock_agent, sample_preferences):
    """Test itinerary refinement"""
    itinerary = await mock_agent.plan_trip(sample_preferences)
    refined = await mock_agent.refine_itinerary(itinerary, "More outdoor activities")
    
    assert refined is not None
    assert 'refined_from' in refined.metadata


def test_get_status(mock_agent):
    """Test agent status reporting"""
    status = mock_agent.get_status()
    
    assert "state" in status
    assert "has_preferences" in status
    assert "activities_found" in status


@pytest.mark.asyncio
async def test_budget_compliance(mock_agent):
    """Test that agent respects budget constraints"""
    preferences = TripPreferences(
        location="San Francisco, CA",
        start_date=datetime.now() + timedelta(days=7),
        duration_days=1,
        budget=Decimal("50.00"),
        interests=[ActivityCategory.MUSEUM],
        party_size=1
    )
    
    itinerary = await mock_agent.plan_trip(preferences)
    assert itinerary.total_cost <= preferences.budget * Decimal("1.05")


# Utility function tests
def test_generate_id():
    """Test ID generation"""
    id1 = generate_id("test")
    id2 = generate_id("test")
    assert id1.startswith("test_")
    assert id1 != id2


def test_format_duration():
    """Test duration formatting"""
    assert format_duration(30) == "30m"
    assert format_duration(60) == "1h"
    assert format_duration(90) == "1h 30m"


def test_validate_budget():
    """Test budget validation"""
    assert validate_budget(Decimal("100"), Decimal("100"), 0.05) is True
    assert validate_budget(Decimal("100"), Decimal("106"), 0.05) is False