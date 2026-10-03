"""
Route and budget optimization module.

This module handles route optimization (TSP) and budget allocation for itineraries.
"""

from typing import List
from datetime import datetime
import logging
from decimal import Decimal

from models import Activity, ItineraryItem, Itinerary, TripPreferences, TransportationMode
from utils import format_duration

logger = logging.getLogger(__name__)


class RouteOptimizer:
    """Optimizes activity routes for minimal travel time"""
    
    def __init__(self):
        self.transport_speeds = {
            TransportationMode.WALKING: 5.0,
            TransportationMode.DRIVING: 30.0,
            TransportationMode.PUBLIC_TRANSIT: 20.0,
            TransportationMode.RIDESHARE: 25.0,
            TransportationMode.BICYCLING: 15.0
        }
    
    def optimize_route(self, activities: List[Activity], 
                      preferences: TripPreferences) -> List[Activity]:
        """Optimize activity order to minimize travel time"""
        if not activities or len(activities) == 1:
            return activities
        
        logger.info(f"Optimizing route for {len(activities)} activities")
        optimized = self._nearest_neighbor(activities, preferences)
        logger.info("Route optimization complete")
        return optimized
    
    def _nearest_neighbor(self, activities: List[Activity], 
                         preferences: TripPreferences) -> List[Activity]:
        """Nearest neighbor heuristic for TSP"""
        if not activities:
            return []
        
        unvisited = activities.copy()
        route = [unvisited.pop(0)]
        
        while unvisited:
            current = route[-1]
            nearest_idx = min(
                range(len(unvisited)),
                key=lambda i: current.location.distance_to(unvisited[i].location)
            )
            route.append(unvisited.pop(nearest_idx))
        
        return route
    
    def calculate_travel_time(self, from_activity: Activity, 
                             to_activity: Activity,
                             mode: TransportationMode) -> int:
        """Calculate travel time in minutes between activities"""
        distance_km = from_activity.location.distance_to(to_activity.location)
        speed_kmh = self.transport_speeds.get(mode, 5.0)
        time_hours = distance_km / speed_kmh
        time_minutes = int(time_hours * 60)
        return max(1, time_minutes)
    
    def calculate_total_distance(self, route: List[Activity]) -> float:
        """Calculate total distance in km for a route"""
        if len(route) < 2:
            return 0.0
        
        total = 0.0
        for i in range(len(route) - 1):
            total += route[i].location.distance_to(route[i + 1].location)
class BudgetOptimizer:
    """Optimizes budget allocation across activities"""
    
    def optimize_budget_distribution(self, preferences: TripPreferences,
                                    activities: List[Activity]) -> List[Activity]:
        """Optimize activity selection based on budget and duration constraints"""
        daily_budget = preferences.get_daily_budget()
        available_hours = preferences.get_available_hours()
        
        # Score and filter activities
        scored = [(a, a.get_score(preferences)) for a in activities]
        scored.sort(key=lambda x: x[1], reverse=True)
        
        selected = []
        total_cost = Decimal('0')
        total_time = 0.0
        
        for activity, score in scored:
            if total_cost + activity.cost > preferences.budget:
                continue
            
            if total_time + (activity.duration_minutes / 60) > available_hours * preferences.duration_days:
                continue
            
            selected.append(activity)
            total_cost += activity.cost
            total_time += activity.duration_minutes / 60
        
        return selected


class ItineraryOptimizer:
    """Main optimizer combining route and budget optimization"""
    
    def __init__(self):
        self.route_optimizer = RouteOptimizer()
        self.budget_optimizer = BudgetOptimizer()
    
    def optimize(self, activities: List[Activity],
                preferences: TripPreferences) -> List[Activity]:
        """Perform complete optimization of activities"""
        logger.info("Starting itinerary optimization")
        
        # Step 1: Budget optimization
        budget_filtered = self.budget_optimizer.optimize_budget_distribution(
            preferences, activities
        )
        
        # Step 2: Route optimization
        optimized_route = self.route_optimizer.optimize_route(
            budget_filtered, preferences
        )
        
        logger.info(f"Optimization complete: {len(optimized_route)} activities selected")
        return optimized_route
        return total
    
    def calculate_total_travel_time(self, route: List[Activity],
                                   mode: TransportationMode) -> int:
        """Calculate total travel time in minutes"""
        if len(route) < 2:
            return 0
        
        total = 0
        for i in range(len(route) - 1):
            total += self.calculate_travel_time(route[i], route[i + 1], mode)
        return total