"""
Utility functions for Trip Planner Agent.

This module provides helper functions used across the application.
"""

import re
import hashlib
import logging
import json
from datetime import datetime, time, timedelta
from typing import List, Dict, Any, Optional
from decimal import Decimal
import asyncio
from functools import lru_cache

logger = logging.getLogger(__name__)


def generate_id(prefix: str = "") -> str:
    """Generate unique identifier"""
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    return f"{prefix}_{timestamp}"


def calculate_hash(data: str) -> str:
    """Calculate SHA256 hash of string"""
    return hashlib.sha256(data.encode()).hexdigest()


def validate_budget(budget: Decimal, total_cost: Decimal, tolerance: float = 0.05) -> bool:
    """Validate if total cost is within budget tolerance"""
    if budget <= 0:
        return True
    return total_cost <= budget * (Decimal("1") + Decimal(str(tolerance)))


def format_duration(minutes: int) -> str:
    """Format minutes into human-readable duration"""
    hours, mins = divmod(minutes, 60)
    if hours > 0 and mins > 0:
        return f"{hours}h {mins}m"
    elif hours > 0:
        return f"{hours}h"
    else:
        return f"{mins}m"

def extract_location_from_query(query: str) -> tuple[str, str]:
    """Extract city and country from user query"""
    parts = query.split(',')
    city = parts[0].strip() if parts else query.strip()
    country = parts[1].strip() if len(parts) > 1 else ""
    return city, country


def calculate_route_efficiency(distance_km: float, time_minutes: int) -> float:
    """Calculate route efficiency score (higher is better)"""
    if time_minutes == 0:
        return 0.0
    avg_speed = (distance_km / (time_minutes / 60))  # km/h
    ideal_speed = 5.0
    efficiency = min(100, (avg_speed / ideal_speed) * 100)
    return efficiency


def merge_activities(activities: List[Dict]) -> List[Dict]:
    """Merge duplicate activities based on name similarity"""
    seen = {}
    merged = []
    
    for activity in activities:
        name = activity.get('name', '').lower()
        if name in seen:
            existing = seen[name]
            existing['reviews_count'] += activity.get('reviews_count', 0)
            existing['rating'] = (existing['rating'] + activity['rating']) / 2
        else:
            seen[name] = activity.copy()
            merged.append(activity)
    
    return merged


def filter_by_accessibility(activities: List[Any], requirements: List[str]) -> List[Any]:
    """Filter activities by accessibility requirements"""
    if not requirements:
        return activities
    
    filtered = []
    for activity in activities:
        if all(req in activity.accessibility_features for req in requirements):
            filtered.append(activity)
    
    return filtered


def optimize_time_slots(activities: List[Any], available_hours: float,
                       start_time: time, pace: str = "moderate") -> List[Any]:
    """Optimize activity scheduling based on available time and pace"""
    pace_factors = {
        "relaxed": 0.7,
        "moderate": 0.85,
        "packed": 0.95
    }
    
    factor = pace_factors.get(pace, 0.85)
    available_minutes = available_hours * 60 * factor
    
    sorted_activities = sorted(activities, key=lambda a: a.rating, reverse=True)
    
    selected = []
    current_duration = 0
    
    for activity in sorted_activities:
        if current_duration + activity.duration_minutes <= available_minutes:
            selected.append(activity)
            current_duration += activity.duration_minutes
    
    return selected


def export_to_csv(itinerary: Any, filepath: str):
    """Export itinerary to CSV format"""
    import csv
    
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            'Time', 'Activity', 'Category', 'Duration', 'Cost', 
            'Rating', 'Location', 'Travel Time'
        ])
        
        for item in itinerary.items:
            writer.writerow([
                item.time.strftime('%I:%M %p'),
                item.activity.name,
                item.activity.category.value,
                format_duration(item.activity.duration_minutes),
                format_currency(item.activity.cost),
                f"{item.activity.rating:.1f}",
                item.activity.location.name,
                format_duration(item.travel_time_to_next)
            ])

def format_currency(amount: Decimal) -> str:
    """Format decimal amount as currency"""
    return f"${float(amount):.2f}"


def parse_time_string(time_str: str) -> Optional[time]:
    """Parse time string in various formats"""
    formats = ["%H:%M", "%I:%M %p", "%I:%M%p", "%H:%M:%S"]
    for fmt in formats:
        try:
            return datetime.strptime(time_str.strip(), fmt).time()
        except ValueError:
            continue
    return None


async def rate_limit(delay: float):
    """Async sleep for rate limiting"""
    await asyncio.sleep(delay)


def sanitize_input(text: str) -> str:
    """Sanitize user input to prevent injection attacks"""
    sanitized = re.sub(r'[<>&\'"]', '', text)
    return sanitized[:1000]


def setup_logging(level: str = "INFO", log_file: Optional[str] = None):
    """Configure logging for the application"""
    log_level = getattr(logging, level.upper(), logging.INFO)
    handlers = [logging.StreamHandler()]
    if log_file:
        handlers.append(logging.FileHandler(log_file))
    
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=handlers
    )