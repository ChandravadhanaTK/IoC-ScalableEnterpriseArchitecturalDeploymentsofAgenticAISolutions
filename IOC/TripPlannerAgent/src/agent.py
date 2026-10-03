"""
Main agent orchestrator.

This module implements the core TripPlannerAgent that coordinates all components
to generate trip itineraries.
"""

import asyncio
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List

from models import TripPreferences, Activity, Itinerary, AgentState, AgentLog
from searcher import ActivitySearcher, MockActivitySearcher
from optimizer import ItineraryOptimizer
from planner import ItineraryPlanner
from utils import generate_id, setup_logging

logger = logging.getLogger(__name__)


class TripPlannerAgent:
    """Main agent orchestrator for trip planning"""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize the agent with configuration"""
        self.config = config or {}
        self.state = AgentState.IDLE
        self.logs: List[AgentLog] = []
        
        # Initialize components
        api_keys = self.config.get('api_keys', {})
        self.searcher = ActivitySearcher(api_keys)
        self.optimizer = ItineraryOptimizer()
        self.planner = ItineraryPlanner()
        
        # Agent state tracking
        self.current_preferences: Optional[TripPreferences] = None
        self.current_activities: List[Activity] = []
        
        logger.info("TripPlannerAgent initialized")
    
    async def plan_trip(self, preferences: TripPreferences) -> Itinerary:
        """Main entry point for trip planning"""
        logger.info(f"Starting trip planning for {preferences.location}")
        self.state = AgentState.PARSING_INPUT
        self.current_preferences = preferences
        
        try:
            # Step 1: Search for activities
            self.state = AgentState.SEARCHING_ACTIVITIES
            self._log_state("Searching for activities")
            activities = await self.searcher.search(preferences)
            self.current_activities = activities
            
            if not activities:
                raise ValueError("No activities found. Try expanding search criteria.")
            
            # Step 2: Optimize activities
            self.state = AgentState.OPTIMIZING_ROUTE
            self._log_state("Optimizing route and budget")
            optimized = self.optimizer.optimize(activities, preferences)
            
            # Step 3: Generate itinerary
            self.state = AgentState.GENERATING_ITINERARY
            self._log_state("Generating itinerary")
            itinerary = self.planner.generate_itinerary(optimized, preferences)
            
            # Step 4: Validate
            self.state = AgentState.FORMATTING_OUTPUT
            self._log_state("Validating itinerary")
            issues = self.planner.validate_itinerary(itinerary)
            
            if issues:
                logger.warning(f"Itinerary validation issues: {issues}")
                itinerary.metadata['validation_issues'] = issues
            
            # Complete
            self.state = AgentState.COMPLETED
            self._log_state("Itinerary generation complete", {"itinerary_id": itinerary.id})
            
            logger.info(f"Trip planning complete: {itinerary.id}")
            return itinerary
            
        except Exception as e:
            self.state = AgentState.FAILED
            self._log_state(f"Planning failed: {str(e)}", {"error": str(e)})
            logger.error(f"Trip planning failed: {e}", exc_info=True)
            raise
    
    async def refine_itinerary(self, itinerary: Itinerary, 
                              feedback: str) -> Itinerary:
        """Refine existing itinerary based on user feedback"""
        logger.info(f"Refining itinerary based on feedback")
        self.state = AgentState.PARSING_INPUT
        refined = await self.plan_trip(itinerary.preferences)
        refined.metadata['refined_from'] = itinerary.id
        refined.metadata['feedback'] = feedback
        return refined
    
    def get_alternative_activities(self, preferences: TripPreferences) -> List[Activity]:
        """Get alternative activities not in current itinerary"""
        if not self.current_activities:
            return []
        
        selected_ids = {a.id for a in self.current_activities}
        alternatives = [
            a for a in self.current_activities 
            if a.id not in selected_ids
        ]
        
        return sorted(alternatives, key=lambda a: a.rating, reverse=True)[:5]
    
    def get_status(self) -> Dict[str, Any]:
        """Get current agent status"""
        return {
            "state": self.state.value,
            "has_preferences": self.current_preferences is not None,
            "activities_found": len(self.current_activities),
            "logs_count": len(self.logs)
        }
    
    def _log_state(self, message: str, data: Optional[Dict] = None):
        """Log agent state transition"""
        log_entry = AgentLog(
            timestamp=datetime.utcnow(),
            state=self.state,
            message=message,
            data=data or {},
            duration_ms=None
        )
        self.logs.append(log_entry)
        logger.debug(f"[{self.state.value}] {message}")
    
    async def close(self):
        """Cleanup resources"""
        await self.searcher.close()
        logger.info("TripPlannerAgent closed")


def create_agent(use_mock: bool = False, **kwargs) -> TripPlannerAgent:
    """
    Factory function to create a TripPlannerAgent.
    
    Args:
        use_mock: If True, use mock searcher (no API keys needed)
        **kwargs: Additional configuration
        
    Returns:
        Configured TripPlannerAgent instance
    """
    config = {
        'api_keys': kwargs.get('api_keys', {}),
        'log_level': kwargs.get('log_level', 'INFO')
    }
    
    # Setup logging
    setup_logging(config['log_level'])
    
    # Create agent
    agent = TripPlannerAgent(config)
    
    # Replace searcher with mock if requested
    if use_mock:
        agent.searcher = MockActivitySearcher()
    
    return agent
