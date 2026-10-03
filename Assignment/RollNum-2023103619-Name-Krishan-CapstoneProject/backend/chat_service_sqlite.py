import anthropic
from config_sqlite import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_SYSTEM_PROMPT = (
    "You are a helpful assistant chatbot. "
    "Write mathematical equations using LaTeX syntax with $ delimiters "
    "(e.g., $E = mc^2$ for inline, $$F = ma$$ for block equations)."
)


class ChatService:
    def __init__(self):
        try:
            self.client = anthropic.AsyncAnthropic(
                api_key=settings.anthropic_api_key
            )
        except Exception as e:
            logger.error(f"Error initializing Anthropic client: {e}")
            raise e

    async def generate_response(self, messages: list, user_id: int = None) -> str:
        try:
            system_text = BASE_SYSTEM_PROMPT

            # Inject RAG context when user_id is provided and RAG is configured
            if user_id is not None:
                try:
                    from rag_service import rag_service
                    if rag_service.is_configured():
                        last_user_msg = next(
                            (m[1] for m in reversed(messages) if m[0] == "user"), ""
                        )
                        if last_user_msg:
                            chunks = rag_service.query(user_id, last_user_msg)
                            if chunks:
                                context = "\n\n---\n\n".join(chunks)
                                system_text = (
                                    BASE_SYSTEM_PROMPT
                                    + "\n\n## Relevant Document Context\n\n"
                                    + context
                                    + "\n\nUse the above context to answer the user's question when relevant."
                                )
                except Exception as e:
                    logger.warning(f"RAG context retrieval failed, proceeding without: {e}")

            formatted_messages = [
                {"role": m[0], "content": m[1]} for m in messages
            ]

            response = await self.client.messages.create(
                model="claude-haiku-4-5",
                max_tokens=1024,
                system=[{
                    "type": "text",
                    "text": system_text,
                    "cache_control": {"type": "ephemeral"},
                }],
                messages=formatted_messages,
            )

            return response.content[0].text

        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return "I'm sorry, I encountered an error while processing your request."


chat_service = ChatService()
