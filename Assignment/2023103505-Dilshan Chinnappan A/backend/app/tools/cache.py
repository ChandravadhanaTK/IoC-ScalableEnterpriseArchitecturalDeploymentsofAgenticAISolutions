import time
from typing import Dict, Any, Optional

class ThreatCache:
    def __init__(self, default_ttl_seconds: int = 86400):  # 24 Hours
        self.default_ttl = default_ttl_seconds
        self._cache: Dict[str, Dict[str, Any]] = {}

    def get(self, key: str) -> Optional[Dict[str, Any]]:
        entry = self._cache.get(key)
        if not entry:
            return None
        if time.time() > entry["expires_at"]:
            del self._cache[key]
            return None
        return entry["data"]

    def set(self, key: str, data: Dict[str, Any], ttl: Optional[int] = None):
        expires_at = time.time() + (ttl or self.default_ttl)
        self._cache[key] = {
            "expires_at": expires_at,
            "data": data
        }

    def clear(self):
        self._cache.clear()

threat_cache = ThreatCache()
