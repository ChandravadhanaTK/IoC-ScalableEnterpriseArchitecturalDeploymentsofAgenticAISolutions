"""
Basic usage example for Trip Planner Agent.

This example demonstrates how to use the agent to plan a simple day trip.
"""

import asyncio
import sys
from pathlib import Path

# Add src directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from datetime import datetime, timedelta

from agent import create_agent
from models import TripPreferences, ActivityCategory, TransportationMode


async def main():
    """Run basic trip planning example"""
    
    # Create agent with mock data (no API keys needed)
    agent = create_agent(use_mock=True, log_level="INFO")
    
    try:
        # Define trip preferences
        preferences = TripPreferences(
            location="San Francisco, CA",
            start_date=datetime.now() + timedelta(days=7),
            duration_days=1,
            budget=100.0,
            interests=[
                ActivityCategory.MUSEUM,
                ActivityCategory.RESTAURANT,
                ActivityCategory.PARK,
                ActivityCategory.LANDMARK
            ],
            party_size=2,
            transportation_preference=TransportationMode.WALKING,
            start_time=datetime.strptime("09:00", "%H:%M").time(),
            end_time=datetime.strptime("21:00", "%H:%M").time(),
            pace="moderate"
        )
        
        print(f"🌍 Planning trip to {preferences.location}")
        print(f"💰 Budget: ${preferences.budget}")
        print(f"🎯 Interests: {[cat.value for cat in preferences.interests]}")
        print("=" * 60)
        
        # Generate itinerary
        print("\n⏳ Searching and optimizing...")
        itinerary = await agent.plan_trip(preferences)
        
        # Display results
        print("\n" + "=" * 60)
        print(itinerary.to_markdown())
        print("=" * 60)
        
        # Show summary
        summary = itinerary.get_summary()
        print("\n## Quick Summary:")
        print(f"  📍 Total Activities: {summary['total_activities']}")
        print(f"  💵 Total Cost: ${summary['total_cost']:.2f} / ${preferences.budget:.2f}")
        print(f"  📏 Total Distance: {summary['total_distance']} km")
        print(f"  ⭐ Average Rating: {summary['average_rating']}/5.0")
        
        # Show alternatives
        if itinerary.alternative_suggestions:
            print("\n## Alternative Activities:")
            for alt in itinerary.alternative_suggestions:
                print(f"  - {alt.name} (⭐{alt.rating:.1f}, ${alt.cost})")
        
        print("\n✅ Trip planning complete!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        await agent.close()


if __name__ == "__main__":
    asyncio.run(main())