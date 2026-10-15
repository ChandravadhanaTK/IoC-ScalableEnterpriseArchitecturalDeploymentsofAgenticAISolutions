"""
Trip planning module.

This module generates detailed itineraries from optimized activities.
"""

from datetime import datetime, time, timedelta
from typing import List, Optional
import logging
from decimal import Decimal

from models import (
    Activity, ItineraryItem, Itinerary, TripPreferences, 
    TransportationMode
)
from optimizer import RouteOptimizer
from utils import generate_id

logger = logging.getLogger(__name__)


class ItineraryPlanner:
    """Generates detailed itineraries from activities"""
    
    def __init__(self):
        self.route_optimizer = RouteOptimizer()
    
    def generate_itinerary(self, activities: List[Activity],
                          preferences: TripPreferences) -> Itinerary:
        """
        Generate a complete itinerary from activities.
        
        Args:
            activities: List of selected activities
            preferences: User preferences
            
        Returns:
            Complete Itinerary object
            
        Raises:
            ValueError: If no activities are provided
        """
        if not activities:
            raise ValueError("Cannot generate an itinerary with no activities.")
        
        logger.info(f"Generating itinerary with {len(activities)} activities")
        
        # Optimize route order
        optimized_activities = self.route_optimizer.optimize_route(activities, preferences)
        
        # Create itinerary items with timing
        items = self._create_itinerary_items(optimized_activities, preferences)
        
        # Calculate totals
        total_cost = sum(item.activity.cost for item in items)
        total_distance = self.route_optimizer.calculate_total_distance(optimized_activities) or 0.0
        total_duration = sum(item.get_total_time() for item in items) / 60.0  # in hours
        
        # Generate alternative suggestions (activities not selected)
        alternatives = self._generate_alternatives(activities, optimized_activities)
        
        itinerary = Itinerary(
            id=generate_id("itinerary"),
            preferences=preferences,
            items=items,
            total_cost=total_cost,
            total_distance_km=total_distance,
            total_duration_hours=total_duration,
            created_at=datetime.utcnow(),
            alternative_suggestions=alternatives
        )
        
        logger.info(f"Itinerary generated: {len(items)} items, ${total_cost}")
        return itinerary
    
    def _create_itinerary_items(self, activities: List[Activity],
                               preferences: TripPreferences) -> List[ItineraryItem]:
        """Create itinerary items with timing and travel info"""
        items = []
        current_time = datetime.combine(
            preferences.start_date.date(),
            preferences.start_time
        )
        
        for idx, activity in enumerate(activities):
            # Create item
            item = ItineraryItem(
                time=current_time,
                activity=activity,
                travel_time_to_next=0,
                travel_mode=preferences.transportation_preference,
                notes=f"Stop {idx + 1} of {len(activities)}"
            )
            
            items.append(item)
            
            # Calculate next activity time
            activity_end = item.get_end_time()
            
            # Add travel time to next activity (except for last)
            if idx < len(activities) - 1:
                travel_time = self.route_optimizer.calculate_travel_time(
                    activity,
                    activities[idx + 1],
                    preferences.transportation_preference
                )
                item.travel_time_to_next = travel_time
                
                # Add buffer time (10 minutes)
                current_time = activity_end + timedelta(minutes=travel_time + 10)
            else:
                current_time = activity_end
        
        return items
    
    def _generate_alternatives(self, all_activities: List[Activity],
                              selected: List[Activity]) -> List[Activity]:
        """Generate alternative activities not in main itinerary"""
        selected_ids = {a.id for a in selected}
        alternatives = [a for a in all_activities if a.id not in selected_ids]
        
        # Sort by rating and return top 5
        alternatives.sort(key=lambda a: a.rating, reverse=True)
        return alternatives[:5]
    
    def validate_itinerary(self, itinerary: Itinerary) -> List[str]:
        """Validate itinerary for issues"""
        issues = []
        
        # Check budget compliance
        budget_limit = itinerary.preferences.budget * Decimal('1.05')
        if itinerary.total_cost > budget_limit:
            issues.append(f"Budget exceeded: ${itinerary.total_cost} > ${itinerary.preferences.budget}")
        
        # Check time constraints
        if itinerary.items:
            last_item = itinerary.items[-1]
            if hasattr(last_item, "get_end_time"):
                last_time = last_item.get_end_time()
            else:
                last_time = last_item.time + timedelta(
                    minutes=getattr(last_item.activity, "duration_minutes", 0)
                )
            end_limit = datetime.combine(
                itinerary.preferences.start_date.date(),
                itinerary.preferences.end_time
            )
            
            if last_time > end_limit:
                issues.append(f"Itinerary extends past end time: {last_time.time()} > {itinerary.preferences.end_time}")
        
        # Check minimum activities
        if len(itinerary.items) < 2:
            issues.append("Itinerary has fewer than 2 activities")
        
        return issues
    
    def refine_itinerary(self, itinerary: Itinerary, 
                        feedback: str) -> Itinerary:
        """
        Refine itinerary based on user feedback.
        
        This is a placeholder for LLM-based refinement.
        """
        logger.info(f"Refining itinerary based on feedback: {feedback}")
        
        # In production, this would use LLM to interpret feedback
        # and adjust itinerary accordingly
        
        # For now, just return the original
        return itinerary