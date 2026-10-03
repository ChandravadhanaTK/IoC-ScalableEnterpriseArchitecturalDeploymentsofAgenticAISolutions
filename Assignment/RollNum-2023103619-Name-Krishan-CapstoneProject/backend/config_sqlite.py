import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY")
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    database_url: str = os.getenv("DATABASE_URL", "chatbot.db")

# Create an instance of the Settings class to access configuration variables
settings = Settings()
