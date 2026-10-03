"""
Single central place to create the LLM (Groq).
Every Agent imports from here so any change (e.g. switching models)
only needs to happen in one place.
"""
import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")


def get_llm(temperature: float = 0.0):
    """
    Returns a Groq LLM instance (openai/gpt-oss-120b).
    temperature=0 for tasks that need precision (extraction, decisions).
    """
    if not GROQ_API_KEY:
        raise RuntimeError(
            "GROQ_API_KEY is missing.\n"
            "Create a .env file and add: GROQ_API_KEY=your_key_here\n"
            "Get a free key from: https://console.groq.com/keys"
        )

    from langchain_groq import ChatGroq

    return ChatGroq(
        model="openai/gpt-oss-120b",
        temperature=temperature,
        api_key=GROQ_API_KEY,
    )
