import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from backend.database.connection import db_manager

logger = logging.getLogger("enterprise_ai.repository")

def serialize_for_json(data: Any) -> Any:
    if isinstance(data, dict):
        return {k: serialize_for_json(v) for k, v in data.items() if k != "_id"}
    elif isinstance(data, list):
        return [serialize_for_json(item) for item in data]
    elif isinstance(data, datetime):
        return data.isoformat()
    return data

class GenericCollection:
    """Unified collection interface abstracting MongoDB and in-memory fallback."""
    def __init__(self, name: str):
        self.name = name
        self._memory_store: Dict[str, Dict[str, Any]] = {}

    @property
    def mongo_col(self):
        if db_manager.is_connected and db_manager.db is not None:
            return db_manager.db[self.name]
        return None

    def find_one(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        col = self.mongo_col
        if col is not None:
            doc = col.find_one(query)
            if doc:
                doc = dict(doc)
                doc.pop("_id", None)
                return doc
            return None

        # Fallback in-memory search
        for item in self._memory_store.values():
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                return dict(item)
        return None

    def find(self, query: Optional[Dict[str, Any]] = None, sort_key: str = "created_at", sort_desc: bool = True, limit: int = 100) -> List[Dict[str, Any]]:
        query = query or {}
        col = self.mongo_col
        if col is not None:
            cursor = col.find(query)
            if sort_key:
                direction = -1 if sort_desc else 1
                cursor = cursor.sort(sort_key, direction)
            if limit:
                cursor = cursor.limit(limit)
            results = []
            for doc in cursor:
                d = dict(doc)
                d.pop("_id", None)
                results.append(d)
            return results

        # In-memory search
        results = []
        for item in self._memory_store.values():
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                results.append(dict(item))

        # Sort
        if sort_key:
            results.sort(
                key=lambda x: str(x.get(sort_key, "")),
                reverse=sort_desc
            )
        if limit:
            results = results[:limit]
        return results

    def insert_one(self, doc: Dict[str, Any]) -> str:
        doc_clean = serialize_for_json(doc)
        item_id = str(doc_clean.get("id") or doc_clean.get("_id") or len(self._memory_store) + 1)
        doc_clean["id"] = item_id

        col = self.mongo_col
        if col is not None:
            mongo_doc = dict(doc_clean)
            mongo_doc["_id"] = item_id
            col.insert_one(mongo_doc)

        self._memory_store[item_id] = doc_clean
        return item_id

    def update_one(self, query: Dict[str, Any], update: Dict[str, Any]) -> bool:
        # Normalize update payload for MongoDB
        if not any(k.startswith("$") for k in update.keys()):
            mongo_update = {"$set": serialize_for_json(update)}
        else:
            mongo_update = serialize_for_json(update)

        col = self.mongo_col
        if col is not None:
            col.update_one(query, mongo_update)

        # Update in-memory
        set_vals = update.get("$set", update)
        for item_id, item in self._memory_store.items():
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                item.update(serialize_for_json(set_vals))
                return True
        return False

    def count_documents(self, query: Optional[Dict[str, Any]] = None) -> int:
        query = query or {}
        col = self.mongo_col
        if col is not None:
            return col.count_documents(query)

        count = 0
        for item in self._memory_store.values():
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                count += 1
        return count

    def delete_many(self, query: Optional[Dict[str, Any]] = None) -> int:
        col = self.mongo_col
        if col is not None:
            res = col.delete_many(query or {})
            self._memory_store.clear()
            return res.deleted_count

        count = len(self._memory_store)
        self._memory_store.clear()
        return count


class Repository:
    def __init__(self):
        self.users = GenericCollection("users")
        self.orders = GenericCollection("orders")
        self.complaints = GenericCollection("complaints")
        self.approvals = GenericCollection("approvals")
        self.audit_logs = GenericCollection("audit_logs")
        self.agent_executions = GenericCollection("agent_executions")

repo = Repository()
