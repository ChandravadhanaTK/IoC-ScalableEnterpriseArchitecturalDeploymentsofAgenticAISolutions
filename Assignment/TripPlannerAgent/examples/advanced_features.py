"""
Advanced features example for Trip Planner Agent.

This example demonstrates:
- Multi-day trip planning
- Itinerary refinement with feedback
- Alternative activity suggestions
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
    """Demonstrate advanced features"""
    
    agent = create_agent(use_mock=True, log_level="INFO")
    
    try:
        print("=" * 60)
        print("🚀 TRIP PLANNER AGENT - ADVANCED FEATURES")
        print("=" * 60)
        
        # Multi-day trip
        print("\n1️⃣  Planning a 3-day trip to New York")
        print("-" * 60)
        
        preferences = TripPreferences(
            location="New York, NY",
            start_date=datetime.now() + timedelta(days=14),
            duration_days=3,
            budget=300.0,
            interests=[
                ActivityCategory.MUSEUM,
                ActivityCategory.RESTAURANT,
                ActivityCategory.LANDMARK,
                ActivityCategory.SHOPPING
            ],
            party_size=2,
            transportation_preference=TransportationMode.PUBLIC_TRANSIT,
            pace="packed"
        )
        
        itinerary = await agent.plan_trip(preferences)
        
        print(f"\n✅ Generated {len(itinerary.items)} activities")
        print(f"   💵 Total Cost: ${itinerary.total_cost:.2f} (Budget: ${preferences.budget:.2f})")
        print(f"   📊 Budget Utilization: {(itinerary.total_cost / preferences.budget * 100):.1f}%")
        
        # Refine with feedback
        print("\n2️⃣  Refining itinerary with feedback")
        print("-" * 60)
        
        feedback = "Add more outdoor activities"
        print(f"   💬 Feedback: '{feedback}'")
        
        refined = await agent.refine_itinerary(itinerary, feedback)
        print(f"   ✅ Refined: {len(refined.items)} activities")
        
        # Get alternatives
        print("\n3️⃣  Alternative activities available")
        print("-" * 60)
        
        alternatives = agent.get_alternative_activities(preferences)
        print(f"   Found {len(alternatives)} alternatives:")
        for idx, alt in enumerate(alternatives[:3], 1):
            print(f"   {idx}. {alt.name} ({alt.category.value}) - ⭐{alt.rating:.1f}")
        
        print("\n" + "=" * 60)
        print("✅ Advanced features demonstration complete!")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        await agent.close()


if __name__ == "__main__":
    asyncio.run(main())