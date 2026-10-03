"""
Data models for Trip Planner Agent.

This module defines all core data structures used throughout the application.
"""

from datetime import datetime, time
from decimal import Decimal
from enum import Enum
from typing import List, Optional, Dict, Tuple, Any
from pydantic import BaseModel, Field, validator


class ActivityCategory(str, Enum):
    """Activity category types"""
    MUSEUM = "museum"
    RESTAURANT = "restaurant"
    PARK = "park"
    LANDMARK = "landmark"
    SHOPPING = "shopping"
    ENTERTAINMENT = "entertainment"
    OUTDOOR = "outdoor"
    CULTURAL = "cultural"
    NIGHTLIFE = "nightlife"
    FAMILY = "family"


class TransportationMode(str, Enum):
    """Transportation options"""
    WALKING = "walking"
    DRIVING = "driving"
    PUBLIC_TRANSIT = "public_transit"
    RIDESHARE = "rideshare"
    BICYCLING = "bicycling"


class Location(BaseModel):
    """Geographic location with coordinates"""
    name: str
    address: str
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    
    def distance_to(self, other: 'Location') -> float:
        """Calculate distance in kilometers to another location"""
        from geopy.distance import geodesic
        return geodesic(
            (self.latitude, self.longitude),
            (other.latitude, other.longitude)
        ).kilometers
    
    def __str__(self) -> str:
        return f"{self.name} ({self.latitude:.4f}, {self.longitude:.4f})"


class TripPreferences(BaseModel):
    """User preferences for trip planning"""
    location: str = Field(min_length=1, description="Destination city/area")
    start_date: datetime
    duration_days: int = Field(gt=0, le=14, description="Trip duration in days")
    budget: Decimal = Field(ge=0, description="Total budget in USD")
    interests: List[ActivityCategory] = Field(min_length=1, description="Activity categories")
    party_size: int = Field(gt=0, le=20, description="Number of travelers")
    accessibility_requirements: List[str] = []
    transportation_preference: TransportationMode = TransportationMode.WALKING
    start_time: time = Field(default_factory=lambda: time(9, 0))
    end_time: time = Field(default_factory=lambda: time(21, 0))
    pace: str = Field(default="moderate", pattern="^(relaxed|moderate|packed)$")
    
    @validator('start_date')
    def validate_start_date(cls, v):
        if v < datetime.now():
            raise ValueError('Start date must be in the future')
        return v
    
    def get_daily_budget(self) -> Decimal:
        """Calculate daily budget allocation"""
        return self.budget / self.duration_days
    
    def get_available_hours(self) -> float:
        """Calculate total available hours per day"""
        from datetime import datetime as dt
        start = dt.combine(dt.today(), self.start_time)
        end = dt.combine(dt.today(), self.end_time)
        return (end - start).total_seconds() / 3600


class ItineraryItem(BaseModel):
    """Single item in an itinerary"""
    time: datetime
    activity: 'Activity'
    travel_time_to_next: int = Field(ge=0, description="Travel time in minutes")
    travel_mode: TransportationMode
    notes: str = ""
    
    def get_end_time(self) -> datetime:
        """Calculate end time including activity duration"""
        from datetime import timedelta
        return self.time + timedelta(minutes=self.activity.duration_minutes)
    
    def get_total_time(self) -> int:
        """Get total time including activity and travel"""
        return self.activity.duration_minutes + self.travel_time_to_next


class Itinerary(BaseModel):
    """Complete trip itinerary"""
    id: str
    preferences: TripPreferences
    items: List[ItineraryItem] = []
    total_cost: Decimal
    total_distance_km: float
    total_duration_hours: float
    created_at: datetime
    alternative_suggestions: List['Activity'] = []
    metadata: Dict[str, Any] = {}
    
    def get_summary(self) -> Dict[str, Any]:
        """Get itinerary summary statistics"""
        return {
            "total_activities": len(self.items),
            "total_cost": float(self.total_cost),
            "total_distance": round(self.total_distance_km, 2),
            "total_duration_hours": round(self.total_duration_hours, 2),
            "categories_covered": list(set(item.activity.category for item in self.items)),
            "average_rating": round(
                sum(item.activity.rating for item in self.items) / len(self.items), 2
            ) if self.items else 0
        }
    
    def to_markdown(self) -> str:
        """Export itinerary to Markdown format"""
        lines = [f"# Trip Itinerary: {self.preferences.location}\n"]
        lines.append(f"**Date**: {self.preferences.start_date.strftime('%Y-%m-%d')}")
        lines.append(f"**Duration**: {self.preferences.duration_days} day(s)")
        lines.append(f"**Budget**: ${self.total_cost:.2f} / ${self.preferences.budget:.2f}\n")
        lines.append("---\n")
        
        from datetime import timedelta
        for idx, item in enumerate(self.items, 1):
            end_time = item.time + timedelta(minutes=item.activity.duration_minutes)
            lines.append(f"## {idx}. {item.activity.name}")
            lines.append(f"**Time**: {item.time.strftime('%I:%M %p')} - {end_time.strftime('%I:%M %p')}")
            lines.append(f"**Category**: {item.activity.category.value}")
            lines.append(f"**Cost**: ${item.activity.cost:.2f}")
            lines.append(f"**Rating**: ⭐ {item.activity.rating:.1f}/5.0")
            lines.append(f"\n{item.activity.description}\n")
            
            if item.travel_time_to_next > 0:
                lines.append(f"*Travel to next: {item.travel_time_to_next} min via {item.travel_mode.value}*\n")
            
            lines.append("---\n")
        
        lines.append("\n## Summary\n")
        summary = self.get_summary()
        lines.append(f"- **Total Activities**: {summary['total_activities']}")
        lines.append(f"- **Total Cost**: ${summary['total_cost']:.2f}")
        lines.append(f"- **Total Distance**: {summary['total_distance']} km")
        lines.append(f"- **Average Rating**: ⭐ {summary['average_rating']}/5.0")
        
        return "\n".join(lines)
    
    def to_json(self) -> Dict[str, Any]:
        """Export itinerary as a JSON-serializable dictionary"""
        return {
            "id": self.id,
            "preferences": self.preferences.model_dump(mode="json"),
            "items": [
                {
                    "time": item.time.isoformat(),
                    "activity": item.activity.model_dump(mode="json"),
                    "travel_time_to_next": item.travel_time_to_next,
                    "travel_mode": item.travel_mode.value,
                    "notes": item.notes,
                }
                for item in self.items
            ],
            "total_cost": float(self.total_cost),
            "total_distance_km": self.total_distance_km,
            "total_duration_hours": self.total_duration_hours,
            "summary": self.get_summary(),
        }


class AgentState(str, Enum):
    """Agent execution states"""
    IDLE = "idle"
    PARSING_INPUT = "parsing_input"
    SEARCHING_ACTIVITIES = "searching"
    FILTERING_RESULTS = "filtering"
    OPTIMIZING_ROUTE = "optimizing"
    GENERATING_ITINERARY = "generating"
    FORMATTING_OUTPUT = "formatting"
    COMPLETED = "completed"
    FAILED = "failed"
    RETRYING = "retrying"


class AgentLog(BaseModel):
    """Agent execution log entry"""
    timestamp: datetime
    state: AgentState
    message: str
    data: Dict[str, Any] = {}
    duration_ms: Optional[int] = None
class Activity(BaseModel):
    """Represents a single activity or point of interest"""
    id: str
    name: str
    category: ActivityCategory
    location: Location
    description: str
    duration_minutes: int = Field(gt=0)
    cost: Decimal = Field(ge=0)
    rating: float = Field(ge=0, le=5)
    reviews_count: int = Field(ge=0)
    operating_hours: Dict[str, Tuple[time, time]]
    website: Optional[str] = None
    phone: Optional[str] = None
    images: List[str] = []
    tags: List[str] = []
    accessibility_features: List[str] = []
    
    def is_open_at(self, check_time: time) -> bool:
        """Check if activity is open at a specific time"""
        day_name = check_time.strftime("%A").lower()
        if day_name not in self.operating_hours:
            return False
        open_time, close_time = self.operating_hours[day_name]
        return open_time <= check_time <= close_time
    
    def get_score(self, preferences: 'TripPreferences') -> float:
        """Calculate relevance score based on user preferences (0-100)"""
        score = 0.0
        
        # Category match (40 points max)
        if self.category in preferences.interests:
            score += 40
        
        # Rating match (30 points max)
        rating_score = (self.rating / 5.0) * 30
        score += rating_score
        
        # Cost efficiency (20 points max)
        if preferences.budget > 0:
            cost_ratio = float(self.cost) / float(preferences.budget)
            if cost_ratio <= 0.1:
                score += 20
            elif cost_ratio <= 0.25:
                score += 15
            elif cost_ratio <= 0.5:
                score += 10
            else:
                score += 5
        
        # Review count credibility (10 points max)
        review_score = min(10, (self.reviews_count / 100) * 10)
        score += review_score
        
        return min(100.0, score)


# Rebuild models to resolve forward references
ItineraryItem.model_rebuild()
Itinerary.model_rebuild()