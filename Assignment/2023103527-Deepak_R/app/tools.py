"""Tool layer used by agents. Mocked data sources; replace with real APIs
(IMD weather, Tamil Nadu land records / Patta-Chitta, etc.) in production."""
import time

RAINFALL_DEFICIT_PCT = {  # % below normal rainfall (sample data)
    "coimbatore": 28, "erode": 12, "thanjavur": 35, "madurai": 22, "salem": 8,
}
LAND_RECORD_ACRES = {  # farmer_id -> registered acres (sample data)
    "TN100001": 5.0, "TN100002": 2.5, "TN100003": 12.0, "TN100004": 1.0,
}


class ToolTimeout(Exception):
    pass


def rainfall_lookup(district: str) -> int:
    return RAINFALL_DEFICIT_PCT.get(district.strip().lower(), 0)


def land_record_lookup(farmer_id: str):
    return LAND_RECORD_ACRES.get(farmer_id.strip().upper())


def with_retry(fn, attempts=3, delay=0.05):
    last = None
    for _ in range(attempts):
        try:
            return fn()
        except ToolTimeout as e:
            last = e
            time.sleep(delay)
    raise last
