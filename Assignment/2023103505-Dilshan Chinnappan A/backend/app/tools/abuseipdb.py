import httpx
import logging
from typing import Dict, Any
from app.config import settings
from app.tools.cache import threat_cache

logger = logging.getLogger("abuseipdb")

ABUSE_IP_SANDBOX = {
    "185.220.101.5": {
        "abuseConfidenceScore": 100,
        "countryCode": "DE",
        "isp": "Zwiebelfreunde e.V.",
        "usageType": "Tor Exit Node",
        "totalReports": 342,
        "lastReportedAt": "2026-10-03T08:12:00Z"
    },
    "198.51.100.44": {
        "abuseConfidenceScore": 85,
        "countryCode": "RU",
        "isp": "Offshore Bulletproof Host",
        "usageType": "Data Center/Web Hosting/Transit",
        "totalReports": 118,
        "lastReportedAt": "2026-10-02T19:40:00Z"
    },
    "45.33.32.156": {
        "abuseConfidenceScore": 96,
        "countryCode": "US",
        "isp": "Linode",
        "usageType": "Scanner / SSH Probe",
        "totalReports": 290,
        "lastReportedAt": "2026-10-03T11:25:00Z"
    }
}

async def query_abuseipdb(ip_address: str) -> Dict[str, Any]:
    cache_key = f"abuseipdb:{ip_address}"
    cached = threat_cache.get(cache_key)
    if cached:
        cached["cached"] = True
        return cached

    if settings.ABUSEIPDB_API_KEY:
        try:
            url = "https://api.abuseipdb.com/api/v2/check"
            params = {"ipAddress": ip_address, "maxAgeInDays": "90"}
            headers = {"Key": settings.ABUSEIPDB_API_KEY, "Accept": "application/json"}
            
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(url, headers=headers, params=params)
                if res.status_code == 200:
                    data = res.json().get("data", {})
                    score = data.get("abuseConfidenceScore", 0)
                    result = {
                        "source": "AbuseIPDB API",
                        "ip": ip_address,
                        "abuse_score": score,
                        "country": data.get("countryCode", "UNKNOWN"),
                        "isp": data.get("isp", "UNKNOWN"),
                        "usage_type": data.get("usageType", "UNKNOWN"),
                        "total_reports": data.get("totalReports", 0),
                        "cached": False
                    }
                    threat_cache.set(cache_key, result)
                    return result
        except Exception as e:
            logger.warning(f"AbuseIPDB live API failed: {e}. Falling back to sandbox.")

    # Sandbox fallback
    match = ABUSE_IP_SANDBOX.get(ip_address)
    if match:
        result = {
            "source": "AbuseIPDB Free Tier (Sandbox)",
            "ip": ip_address,
            "abuse_score": match["abuseConfidenceScore"],
            "country": match["countryCode"],
            "isp": match["isp"],
            "usage_type": match["usageType"],
            "total_reports": match["totalReports"],
            "cached": False
        }
    else:
        result = {
            "source": "AbuseIPDB Free Tier (Sandbox)",
            "ip": ip_address,
            "abuse_score": 12,
            "country": "US",
            "isp": "Commercial Cloud Transit",
            "usage_type": "Hosting Provider",
            "total_reports": 2,
            "cached": False
        }

    threat_cache.set(cache_key, result)
    return result
