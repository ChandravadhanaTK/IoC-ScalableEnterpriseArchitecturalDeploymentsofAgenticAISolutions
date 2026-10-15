"""
Activity search and discovery module.

This module handles searching for activities, restaurants, and points of interest
from multiple sources.
"""

import asyncio
import httpx
from typing import List, Dict, Any, Optional
from datetime import datetime, time
import logging
from decimal import Decimal
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from models import Activity, ActivityCategory, Location, TripPreferences
from utils import generate_id, rate_limit

logger = logging.getLogger(__name__)


class ActivitySearcher:
    """Searches for activities from multiple sources"""
    
    def __init__(self, api_keys: Dict[str, str]):
        self.api_keys = api_keys
        self.client = httpx.AsyncClient(timeout=30.0)
        self.cache: Dict[str, List[Activity]] = {}
    
    async def search(self, preferences: TripPreferences) -> List[Activity]:
        """Search for activities based on user preferences"""
        logger.info(f"Searching activities for {preferences.location}")
        
        # Check cache first
        cache_key = f"{preferences.location}_{preferences.start_date.date()}"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        activities = []
        
        # Search from multiple sources concurrently
        search_tasks = [
            self._search_google_places(preferences),
        ]
        
        results = await asyncio.gather(*search_tasks, return_exceptions=True)
        
        for result in results:
            if isinstance(result, Exception):
                logger.error(f"Search error: {result}")
                continue
            if result:
                activities.extend(result)
        
        # Remove duplicates
        activities = self._deduplicate_activities(activities)
        
        # Cache results
        self.cache[cache_key] = activities
        
        logger.info(f"Found {len(activities)} activities")
        return activities
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.NetworkError))
    )
    async def _search_google_places(self, preferences: TripPreferences) -> List[Activity]:
        """Search Google Places API"""
        if 'google_places' not in self.api_keys:
            return []
        
        api_key = self.api_keys['google_places']
        activities = []
        
        # Search for each interest category
        for category in preferences.interests:
            await rate_limit(0.1)
            
            url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
            params = {
                'query': f"{category.value} in {preferences.location}",
                'key': api_key,
                'type': 'establishment'
            }
            
            try:
                response = await self.client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                
                for place in data.get('results', [])[:10]:
                    activity = self._parse_google_place(place, category)
                    if activity:
                        activities.append(activity)
                        
            except Exception as e:
                logger.error(f"Google Places error: {e}")
                continue
        
        return activities
    
    def _parse_google_place(self, place: Dict, category: ActivityCategory) -> Optional[Activity]:
        """Parse Google Places result into Activity model"""
    def _deduplicate_activities(self, activities: List[Activity]) -> List[Activity]:
        """Remove duplicate activities based on name similarity"""
        seen = {}
        unique = []
        
        for activity in activities:
            name_lower = activity.name.lower().strip()
            if name_lower not in seen:
                seen[name_lower] = activity
                unique.append(activity)
        
        return unique
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()


class MockActivitySearcher(ActivitySearcher):
    """Mock searcher for testing without API keys"""
    
    def __init__(self):
        super().__init__({})
    
    async def search(self, preferences: TripPreferences) -> List[Activity]:
        """Return mock activities for testing"""
        from datetime import time as dt_time
        
        mock_activities = [
            Activity(
                id=generate_id("activity"),
                name=f"Sample {cat.value}",
                category=cat,
                location=Location(
                    name=f"Location {idx}",
                    address=f"{idx} Main St",
                    latitude=37.7749 + (idx * 0.01),
                    longitude=-122.4194 + (idx * 0.01)
                ),
                description=f"A wonderful {cat.value} experience",
                duration_minutes=60,
                cost=Decimal(15 + idx * 5),
                rating=4.0 + (idx % 5) * 0.2,
                reviews_count=100 + idx * 10,
                operating_hours={
                    'monday': (dt_time(9, 0), dt_time(18, 0)),
                    'tuesday': (dt_time(9, 0), dt_time(18, 0)),
                    'wednesday': (dt_time(9, 0), dt_time(18, 0)),
                    'thursday': (dt_time(9, 0), dt_time(18, 0)),
                    'friday': (dt_time(9, 0), dt_time(18, 0)),
                    'saturday': (dt_time(10, 0), dt_time(17, 0)),
                    'sunday': (dt_time(10, 0), dt_time(17, 0))
                }
            )
            for idx, cat in enumerate(preferences.interests[:5], 1)
        ]
        
        return mock_activities
        try:
            if 'geometry' not in place or 'location' not in place['geometry']:
                return None
            
            location = Location(
                name=place.get('name', ''),
                address=place.get('formatted_address', ''),
                latitude=place['geometry']['location']['lat'],
                longitude=place['geometry']['location']['lng']
            )
            
            activity = Activity(
                id=generate_id("activity"),
                name=place.get('name', ''),
                category=category,
                location=location,
                description=place.get('formatted_address', ''),
                duration_minutes=60,
                cost=Decimal(place.get('price_level', 1) * 10),
                rating=float(place.get('rating', 0)),
                reviews_count=place.get('user_ratings_total', 0),
                operating_hours={},
                website=place.get('website'),
                phone=place.get('formatted_phone_number')
            )
            
            return activity
        except Exception as e:
            logger.error(f"Error parsing place: {e}")
            return None