import json
import hashlib
import os
from datetime import datetime
from typing import Dict, Any, List
from pathlib import Path
from app.config import settings

class ImmutableAuditLog:
    def __init__(self, log_path: str = settings.AUDIT_LOG_PATH):
        self.log_path = Path(log_path)
        self.log_path.parent.mkdir(parents=True, exist_ok=True)
        self.last_hash = self._get_last_hash()

    def _get_last_hash(self) -> str:
        if not self.log_path.exists():
            return "0" * 64
        last_line = ""
        try:
            with open(self.log_path, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        last_line = line.strip()
            if last_line:
                entry = json.loads(last_line)
                return entry.get("entry_hash", "0" * 64)
        except Exception:
            pass
        return "0" * 64

    def record_event(
        self,
        event_type: str,
        incident_id: str,
        principal: str,
        action: str,
        details: Dict[str, Any]
    ) -> str:
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        # Build payload for cryptographic hashing
        payload_data = {
            "prev_hash": self.last_hash,
            "timestamp": timestamp,
            "event_type": event_type,
            "incident_id": incident_id,
            "principal": principal,
            "action": action,
            "details": details
        }
        
        payload_str = json.dumps(payload_data, sort_keys=True)
        entry_hash = hashlib.sha256(payload_str.encode("utf-8")).hexdigest()
        payload_data["entry_hash"] = entry_hash
        
        # Append-only write
        with open(self.log_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(payload_data) + "\n")
            
        self.last_hash = entry_hash
        return entry_hash

    def get_recent_entries(self, limit: int = 50) -> List[Dict[str, Any]]:
        if not self.log_path.exists():
            return []
        entries = []
        try:
            with open(self.log_path, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        entries.append(json.loads(line))
        except Exception:
            pass
        return entries[-limit:]

audit_logger = ImmutableAuditLog()
