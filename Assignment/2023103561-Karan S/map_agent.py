"""
Map Agent
=========
Takes the text location and resolves it to coordinates, then estimates
the distance to the nearest emergency unit.

To guarantee "no errors" even without internet/map API keys, we use:
1. A real geocoding attempt via geopy (Nominatim - free, no API key needed).
2. If it fails (no internet, unknown place) -> fallback to safe default coordinates.
"""
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderServiceError, GeocoderTimedOut

_geolocator = Nominatim(user_agent="incident_response_system")

# Fallback coordinates used when geocoding fails - example city center
_FALLBACK_COORDS = {"lat": 30.0444, "lng": 31.2357}  # Cairo as a default reference


def map_agent(state: dict) -> dict:
    """
    Node function for LangGraph.
    Input: state containing 'location'
    Output: updated state with map_info
    """
    location = state.get("location", "")
    trace = state.get("trace", [])

    coords = _FALLBACK_COORDS.copy()
    resolved = False

    try:
        geo = _geolocator.geocode(location, timeout=5)
        if geo:
            coords = {"lat": geo.latitude, "lng": geo.longitude}
            resolved = True
    except (GeocoderServiceError, GeocoderTimedOut, Exception):
        # Any network/timeout issue -> use the fallback without breaking the system
        pass

    # Simplified distance estimate (in a real system this would come from
    # an actual database of unit locations)
    estimated_distance_km = 3.5 if resolved else 5.0

    map_info = {
        "lat": coords["lat"],
        "lng": coords["lng"],
        "resolved": resolved,
        "estimated_distance_km": estimated_distance_km,
    }

    trace.append(
        f"Map Agent: {'location resolved precisely' if resolved else 'used approximate fallback location'}"
    )

    return {"map_info": map_info, "trace": trace}
