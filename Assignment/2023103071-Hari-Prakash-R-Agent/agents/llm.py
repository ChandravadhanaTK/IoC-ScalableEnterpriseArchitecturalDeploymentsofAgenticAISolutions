import json
import os


class LLMError(Exception):
    pass


class LLMClient:
    def __init__(self, model: str, api_key=None):
        self.model = model
        self.api_key = api_key

    def generate(self, prompt: str, system=None) -> str:
        raise NotImplementedError

    def generate_json(self, prompt: str, system=None) -> dict:
        text = self.generate(prompt, system=system)
        return parse_json_object(text)


def parse_json_object(text: str) -> dict:
    t = text.strip()
    if t.startswith("```"):
        parts = t.split("```")
        if len(parts) >= 3:
            t = parts[1]
            if t.startswith("json"):
                t = t[4:]
    start, end = t.find("{"), t.rfind("}")
    if start == -1 or end == -1:
        raise LLMError("no JSON object in model response")
    try:
        return json.loads(t[start:end + 1])
    except json.JSONDecodeError as e:
        raise LLMError(f"invalid JSON in model response: {e}") from e


class FakeLLMClient(LLMClient):
    def __init__(self, model="fake", api_key=None, script=None, handler=None):
        super().__init__(model, api_key)
        self.script = list(script or [])
        self.handler = handler

    def generate(self, prompt, system=None) -> str:
        if self.handler is not None:
            result = self.handler(prompt, system)
        elif self.script:
            result = self.script.pop(0)
        else:
            raise LLMError("FakeLLMClient exhausted script and has no handler")
        if isinstance(result, (dict, list)):
            return json.dumps(result)
        return str(result)


def make_llm_client(cfg, api_key=None) -> LLMClient:
    provider = getattr(cfg, "provider", None) or "gemini"
    if provider == "groq":
        return _make_groq_client(cfg, api_key)
    key = api_key or os.environ.get("GEMINI_API_KEY", "")
    if not key:
        raise LLMError("GEMINI_API_KEY not set (see README setup)")
    return _GeminiClient(cfg.model, cfg.max_retries, cfg.backoff_base_s, key)


def with_retry(fn, max_retries: int, base_s: float):
    """Call fn(); on LLMError or Exception, retry with exponential backoff."""
    for attempt in range(max_retries + 1):
        try:
            return fn()
        except Exception as exc:
            if attempt == max_retries:
                raise
            import time
            time.sleep(base_s * (2 ** attempt))


class _GeminiClient(LLMClient):
    def __init__(self, model: str, max_retries: int, backoff_base_s: float, api_key: str):
        super().__init__(model, api_key)
        self.model = model
        self.max_retries = max_retries
        self.backoff_base_s = backoff_base_s
        self.api_key = api_key

    def generate(self, prompt, system=None) -> str:
        def _call():
            from google import genai
            from google.genai import types
            client = genai.Client(api_key=self.api_key)
            resp = client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system,
                    temperature=0.0,
                ),
            )
            if not resp.text:
                raise LLMError(f"empty response from {self.model}")
            return resp.text
        return with_retry(_call, self.max_retries, self.backoff_base_s)


def _make_groq_client(cfg, api_key=None) -> LLMClient:
    key = api_key or os.environ.get("GROQ_API_KEY", "")
    if not key:
        raise LLMError("GROQ_API_KEY not set (see README setup)")
    return _GroqClient(cfg.model, cfg.max_retries, cfg.backoff_base_s, key)


class _GroqClient(LLMClient):
    def __init__(self, model: str, max_retries: int, backoff_base_s: float, api_key: str):
        super().__init__(model, api_key)
        self.model = model
        self.max_retries = max_retries
        self.backoff_base_s = backoff_base_s
        self.api_key = api_key

    def generate(self, prompt, system=None) -> str:
        def _call():
            from openai import OpenAI
            client = OpenAI(
                api_key=self.api_key,
                base_url="https://api.groq.com/openai/v1",
            )
            messages = []
            if system:
                messages.append({"role": "system", "content": system})
            messages.append({"role": "user", "content": prompt})
            resp = client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.0,
            )
            content = (resp.choices[0].message.content if resp.choices else "") or ""
            content = content.strip()
            if not content:
                raise LLMError(f"empty response from {self.model}")
            return content
        return with_retry(_call, self.max_retries, self.backoff_base_s)