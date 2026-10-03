"""Model access.

One place constructs the chat model so the rest of the code never names a
provider. Swapping Ollama for a hosted model is a change here and in config,
which is the "isolate model choice from tool contracts" rule from Module 3.
"""
from __future__ import annotations

import json
import re
from typing import Type, TypeVar

from langchain_core.messages import BaseMessage
from langchain_ollama import ChatOllama
from pydantic import BaseModel, ValidationError

from .config import settings
from .telemetry import record_usage

T = TypeVar("T", bound=BaseModel)


def chat_model(temperature: float | None = None, json_mode: bool = False) -> ChatOllama:
    # A hard timeout per model call so a stuck Ollama cannot pin a server thread.
    kwargs = {"model": settings.chat_model, "base_url": settings.ollama_base_url,
              "temperature": settings.temperature if temperature is None else temperature,
              "num_ctx": 8192, "client_kwargs": {"timeout": settings.llm_timeout_seconds}}
    if json_mode:
        kwargs["format"] = "json"
    return ChatOllama(**kwargs)


def structured(schema: Type[T], messages: list[BaseMessage], temperature: float = 0.0, step: str = "structured") -> T:
    """Ask for a JSON object matching `schema` and validate it.

    Ollama's JSON mode guarantees syntactically valid JSON, not schema
    conformance. Small models also tend to echo a raw JSON schema back when
    shown one, so the prompt describes the fields in plain words and shows an
    example instance instead. The reply is validated with Pydantic, with one
    repair attempt.
    """
    llm = chat_model(temperature=temperature, json_mode=True)
    primed = list(messages)
    primed[-1] = primed[-1].model_copy(update={
        "content": f"{primed[-1].content}\n\n{_field_guide(schema)}"
    })
    last_error = ""
    for _ in range(2):
        reply = llm.invoke(primed)
        record_usage(reply, step=step)
        text = reply.content if isinstance(reply.content, str) else str(reply.content)
        try:
            obj = _extract_json(text)
            if not isinstance(obj, dict):
                raise ValueError("reply was not a JSON object")
            if "properties" in obj and "type" in obj:
                raise ValueError("reply was a schema, not an instance")
            return schema.model_validate(obj)
        except (ValidationError, ValueError) as e:
            last_error = str(e)
            primed = primed + [reply, primed[-1].model_copy(update={"content": f"That was not valid: {last_error[:300]}. Reply again with only the JSON object, using the field names and types listed."})]
    raise ValueError(f"model did not produce a valid {schema.__name__}: {last_error[:200]}")


def _field_guide(schema: Type[BaseModel]) -> str:
    """Plain-language field list plus a filled example, derived from the model."""
    lines = []
    example: dict = {}
    for name, field in schema.model_fields.items():
        ann = field.annotation
        origin = getattr(ann, "__origin__", None)
        if ann is bool:
            kind, example[name] = "true or false", True
        elif ann is int:
            kind, example[name] = "integer", 0
        elif ann is float:
            kind, example[name] = "number", 0.0
        elif origin is list or ann is list:
            kind, example[name] = "list of strings", []
        else:
            kind, example[name] = "string", ""
        desc = f" ({field.description})" if field.description else ""
        lines.append(f"- {name}: {kind}{desc}")
    return ("Reply with exactly one JSON object and nothing else. Fields:\n" + "\n".join(lines)
            + "\nExample shape (fill in real values): " + json.dumps(example))


def _extract_json(text: str) -> dict:
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", text, re.S)
        if not m:
            raise ValueError("no JSON object in reply")
        return json.loads(m.group(0))
