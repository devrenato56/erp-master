from __future__ import annotations

import json
import logging
import re

from app.core.llm_provider import completar

logger = logging.getLogger(__name__)

_MAX_REINTENTOS = 2

# Cuántos caracteres del texto enviar al LLM (evitar exceder límites de tokens)
_MAX_CHARS_MUESTRA = 3000

_PROMPT_SISTEMA = """Eres un moderador de contenido para una plataforma educativa sobre sistemas ERP (Enterprise Resource Planning).

Tu tarea es evaluar si un documento es apropiado para compartirse en la base de conocimiento pública de la plataforma.

Criterios de aprobación (TODOS deben cumplirse):
1. El contenido es relevante para sistemas ERP, gestión empresarial, implementación de software, gestión del cambio organizacional, o temas directamente relacionados.
2. El contenido no incluye material ofensivo, discriminatorio, violento o inapropiado.
3. El contenido parece ser material educativo o profesional legítimo.

Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional antes ni después:
{"aprobado": true, "motivo": "Breve explicación"}
o
{"aprobado": false, "motivo": "Razón específica del rechazo en español"}"""

_PROMPT_USUARIO = """Evalúa el siguiente fragmento de documento:

---
{muestra}
---

Responde solo con el JSON indicado."""


class ResultadoModeracion:
    def __init__(self, aprobado: bool, motivo: str) -> None:
        self.aprobado = aprobado
        self.motivo = motivo

    def __repr__(self) -> str:
        estado = "APROBADO" if self.aprobado else "RECHAZADO"
        return f"ResultadoModeracion({estado}: {self.motivo!r})"


def moderar_documento(texto_extraido: str) -> ResultadoModeracion:
    """
    Evalúa si el contenido es relevante a ERP y apropiado para compartirse.
    Solo debe llamarse cuando visibilidad == 'compartido' (RF-08).
    Ante respuesta ambigua o mal formada: fallback a 'pendiente' (aprobado=False).
    """
    muestra = texto_extraido[:_MAX_CHARS_MUESTRA].strip()
    messages = [
        {"role": "system", "content": _PROMPT_SISTEMA},
        {"role": "user", "content": _PROMPT_USUARIO.format(muestra=muestra)},
    ]

    for intento in range(1, _MAX_REINTENTOS + 1):
        try:
            respuesta = completar(messages, temperature=0.0, max_tokens=256)
            resultado = _parsear_respuesta(respuesta)
            if resultado is not None:
                return resultado
            logger.warning("Moderación: respuesta mal formada (intento %d): %r", intento, respuesta[:200])
        except Exception as e:
            logger.warning("Moderación: error en LLM (intento %d): %s", intento, e)

    # Fallback: no aprobar ante ambigüedad — queda como pendiente para revisión
    logger.error("Moderación: %d intentos fallidos, documento queda pendiente.", _MAX_REINTENTOS)
    return ResultadoModeracion(
        aprobado=False,
        motivo="No se pudo completar la moderación automática. El documento quedará pendiente de revisión manual.",
    )


def _parsear_respuesta(texto: str) -> ResultadoModeracion | None:
    """
    Extrae el JSON de la respuesta del LLM.
    Tolera texto extra antes/después del bloque JSON.
    Devuelve None si no puede parsearse de forma segura.
    """
    # Buscar bloque JSON en la respuesta (el LLM a veces agrega texto extra)
    match = re.search(r'\{[^{}]+\}', texto, re.DOTALL)
    if not match:
        return None

    try:
        data = json.loads(match.group())
    except json.JSONDecodeError:
        return None

    if not isinstance(data.get("aprobado"), bool):
        return None
    if not isinstance(data.get("motivo"), str) or not data["motivo"].strip():
        return None

    return ResultadoModeracion(
        aprobado=data["aprobado"],
        motivo=data["motivo"].strip(),
    )
