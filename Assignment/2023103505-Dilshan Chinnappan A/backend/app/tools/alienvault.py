import httpx
import logging
from typing import Dict, Any
from app.config import settings
from app.tools.cache import threat_cache

logger = logging.getLogger("alienvault")

OTX_SANDBOX = {
    "185.220.101.5": {
        "pulse_count": 28,
        "adversary": "APT29 / Cozy Bear",
        "malware_families": ["Cobalt Strike", "Tor Bridge", "Sliver C2"],
        "industries": ["Financial Services", "Defense", "Government"]
    },
    "198.51.100.44": {
        "pulse_count": 14,
        "adversary": "FIN7",
        "malware_families": ["AsyncRAT", "RedLine Stealer"],
        "industries": ["Retail", "Fintech"]
    },
    "malicious-payload-drop.org": {
        "pulse_count": 19,
        "adversary": "Storm-0558",
        "malware_families": ["EvilProxy", "AiTM Phishing"],
        "industries": ["Cloud Infrastructure", "Enterprise Tech"]
    }
}

async def query_alienvault_otx(indicator: str, ioc_type: str) -> Dict[str, Any]:
    cache_key = f"otx:{indicator}"
    cached = threat_cache.get(cache_key)
    if cached:
        cached["cached"] = True
        return cached

    if settings.ALIENVAULT_API_KEY:
        try:
            section = "IPv4" if "ip" in ioc_type else ("domain" if ioc_type == "domain" else "file")
            url = f"https://otx.alienvault.com/api/v1/indicators/{section}/{indicator}/general"
            headers = {"X-OTX-API-KEY": settings.ALIENVAULT_API_KEY}
            
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(url, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    pulse_info = data.get("pulse_info", {})
                    pulses = pulse_info.get("count", 0)
                    result = {
                        "source": "AlienVault OTX API",
                        "indicator": indicator,
                        "pulse_count": pulses,
                        "adversary": "Known Adversary Group" if pulses > 5 else "Generic",
                        "malware_families": [t.get("name") for t in pulse_info.get("pulses", [])[:3]],
                        "cached": False
                    }
                    threat_cache.set(cache_key, result)
                    return result
        except Exception as e:
            logger.warning(f"AlienVault live query failed: {e}. Falling back to sandbox.")

    # Sandbox fallback
    match = OTX_SANDBOX.get(indicator)
    if match:
        result = {
            "source": "AlienVault OTX (Sandbox)",
            "indicator": indicator,
            "pulse_count": match["pulse_count"],
            "adversary": match["adversary"],
            "malware_families": match["malware_families"],
            "industries": match["industries"],
            "cached": False
        }
    else:
        result = {
            "source": "AlienVault OTX (Sandbox)",
            "indicator": indicator,
            "pulse_count": 0,
            "adversary": "None Detected",
            "malware_families": [],
            "industries": [],
            "cached": False
        }

    threat_cache.set(cache_key, result)
    return result
