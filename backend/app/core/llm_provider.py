from __future__ import annotations

import json
import logging
from typing import Any

import httpx
from groq import Groq

from app.core.config import settings

logger = logging.getLogger(__name__)

# Modelos por defecto por proveedor
_GROQ_MODEL = "llama-3.3-70b-versatile"
_OLLAMA_MODEL = "llama3.1:8b"


def completar(
    messages: list[dict[str, str]],
    temperature: float = 0.2,
    max_tokens: int = 1024,
) -> str:
    """
    Llama al LLM configurado (Groq o Ollama) y devuelve el texto generado.
    El prompt y el historial se pasan como lista de mensajes estándar
    (misma interfaz OpenAI-compatible que usan ambos proveedores).
    """
    provider = settings.llm_provider.lower()

    if provider == "groq":
        return _completar_groq(messages, temperature, max_tokens)
    elif provider == "ollama":
        return _completar_ollama(messages, temperature, max_tokens)
    else:
        raise ValueError(
            f"LLM_PROVIDER inválido: '{settings.llm_provider}'. Valores aceptados: 'groq', 'ollama'."
        )


def _completar_groq(
    messages: list[dict[str, str]],
    temperature: float,
    max_tokens: int,
) -> str:
    client = Groq(api_key=settings.groq_api_key)
    response = client.chat.completions.create(
        model=_GROQ_MODEL,
        messages=messages,  # type: ignore[arg-type]
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content or ""


def _completar_ollama(
    messages: list[dict[str, str]],
    temperature: float,
    max_tokens: int,
) -> str:
    url = f"{settings.ollama_base_url.rstrip('/')}/api/chat"
    payload: dict[str, Any] = {
        "model": _OLLAMA_MODEL,
        "messages": messages,
        "stream": False,
        "options": {"temperature": temperature, "num_predict": max_tokens},
    }
    resp = httpx.post(url, json=payload, timeout=60.0)
    resp.raise_for_status()
    data = resp.json()
    return data["message"]["content"]
