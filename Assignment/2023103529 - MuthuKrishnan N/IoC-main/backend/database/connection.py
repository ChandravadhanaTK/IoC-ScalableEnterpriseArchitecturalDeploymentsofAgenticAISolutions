import logging
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from backend.config import settings

logger = logging.getLogger("enterprise_ai.db")

class DatabaseManager:
    def __init__(self):
        self.client = None
        self.db = None
        self.is_connected = False
        self._init_connection()

    def _init_connection(self):
        try:
            # Set a 1.5 second timeout to avoid blocking local runs if Mongo isn't up
            self.client = MongoClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=1500,
                connectTimeoutMS=1500
            )
            # Trigger quick server ping
            self.client.admin.command('ping')
            self.db = self.client[settings.DATABASE_NAME]
            self.is_connected = True
            logger.info(f"Connected to live MongoDB at {settings.MONGODB_URI}, database: {settings.DATABASE_NAME}")
        except (ConnectionFailure, ServerSelectionTimeoutError, Exception) as exc:
            self.is_connected = False
            self.client = None
            self.db = None
            logger.warning(
                f"MongoDB not reachable ({exc}). Operating in High-Fidelity Demo In-Memory / Local Store Mode."
            )

db_manager = DatabaseManager()
