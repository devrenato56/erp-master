from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.auth import get_current_user_id
from app.core.supabase_client import supabase
from app.core.llm_provider import completar, LLMError
from app.chat.retriever import recuperar_contexto, construir_contexto_texto

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/modulos", tags=["modulos"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class SubtemaOut(BaseModel):
    id: str
    nombre: str
    descripcion: str | None
    orden: int
    preguntas_sugeridas: list[str] | None = None


class ModuloListItem(BaseModel):
    id: str
    nombre: str
    descripcion: str | None
    orden: int
    resumen_ia: str | None
    completado: bool


class ModuloDetalleOut(BaseModel):
    id: str
    nombre: str
    descripcion: str | None
    orden: int
    resumen_ia: str | None
    completado: bool
    subtemas: list[SubtemaOut]


class ProgresoOut(BaseModel):
    modulo_id: str
    completado: bool
    completado_en: str | None


# ---------------------------------------------------------------------------
# GET /modulos — lista todos los módulos con progreso del usuario
# ---------------------------------------------------------------------------

@router.get("", response_model=list[ModuloListItem])
async def listar_modulos(user_id: str = Depends(get_current_user_id)):
    modulos_resp = (
        supabase.table("modulo")
        .select("id, nombre, descripcion, orden, resumen_ia")
        .order("orden")
        .execute()
    )
    modulos = modulos_resp.data or []

    prog_resp = (
        supabase.table("progreso_modulo")
        .select("modulo_id, completado")
        .eq("usuario_id", user_id)
        .execute()
    )
    completados = {p["modulo_id"] for p in (prog_resp.data or []) if p["completado"]}

    return [
        ModuloListItem(
            id=m["id"],
            nombre=m["nombre"],
            descripcion=m["descripcion"],
            orden=m["orden"],
            resumen_ia=m["resumen_ia"],
            completado=m["id"] in completados,
        )
        for m in modulos
    ]


# ---------------------------------------------------------------------------
# GET /modulos/{modulo_id} — detalle del módulo con sub-temas
# ---------------------------------------------------------------------------

@router.get("/{modulo_id}", response_model=ModuloDetalleOut)
async def obtener_modulo(
    modulo_id: str,
    user_id: str = Depends(get_current_user_id),
):
    mod_resp = (
        supabase.table("modulo")
        .select("id, nombre, descripcion, orden, resumen_ia")
        .eq("id", modulo_id)
        .single()
        .execute()
    )
    if not mod_resp.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Módulo no encontrado.")

    modulo = mod_resp.data

    prog_resp = (
        supabase.table("progreso_modulo")
        .select("completado")
        .eq("usuario_id", user_id)
        .eq("modulo_id", modulo_id)
        .execute()
    )
    completado = bool(prog_resp.data[0]["completado"]) if prog_resp.data else False

    temas_resp = (
        supabase.table("tema")
        .select("id, nombre, descripcion, orden, preguntas_sugeridas")
        .eq("modulo_id", modulo_id)
        .order("orden")
        .execute()
    )
    subtemas = [
        SubtemaOut(
            id=t["id"],
            nombre=t["nombre"],
            descripcion=t["descripcion"],
            orden=t["orden"],
            preguntas_sugeridas=t.get("preguntas_sugeridas"),
        )
        for t in (temas_resp.data or [])
    ]

    return ModuloDetalleOut(
        id=modulo["id"],
        nombre=modulo["nombre"],
        descripcion=modulo["descripcion"],
        orden=modulo["orden"],
        resumen_ia=modulo["resumen_ia"],
        completado=completado,
        subtemas=subtemas,
    )


# ---------------------------------------------------------------------------
# GET /modulos/{modulo_id}/progreso — progreso del usuario en este módulo
# ---------------------------------------------------------------------------

@router.get("/{modulo_id}/progreso", response_model=ProgresoOut)
async def obtener_progreso(
    modulo_id: str,
    user_id: str = Depends(get_current_user_id),
):
    mod_resp = (
        supabase.table("modulo")
        .select("id")
        .eq("id", modulo_id)
        .single()
        .execute()
    )
    if not mod_resp.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Módulo no encontrado.")

    prog_resp = (
        supabase.table("progreso_modulo")
        .select("completado, completado_en")
        .eq("usuario_id", user_id)
        .eq("modulo_id", modulo_id)
        .execute()
    )
    if not prog_resp.data:
        return ProgresoOut(modulo_id=modulo_id, completado=False, completado_en=None)

    p = prog_resp.data[0]
    return ProgresoOut(
        modulo_id=modulo_id,
        completado=bool(p["completado"]),
        completado_en=p.get("completado_en"),
    )


# ---------------------------------------------------------------------------
# POST /modulos/{modulo_id}/resumen — genera y persiste el resumen IA
# ---------------------------------------------------------------------------

_PROMPT_RESUMEN_SISTEMA = """\
Eres un experto en sistemas ERP que escribe resúmenes ejecutivos para cursos de formación profesional.
Tu tarea es escribir un resumen claro, motivador y conciso de un módulo de aprendizaje sobre ERP,
basándote ÚNICAMENTE en el contenido proporcionado.
Responde en español con párrafos bien estructurados. No uses listas de viñetas ni markdown.
"""

_PROMPT_RESUMEN_USUARIO = """\
Escribe un resumen ejecutivo del módulo "{nombre}" en exactamente 3 párrafos:
1. Qué conceptos cubre el módulo y por qué son importantes.
2. Qué aprenderá el estudiante al completarlo.
3. Cómo conecta con la práctica profesional en implementación de ERP.

Basate únicamente en el siguiente material:
---
{contexto}
---
"""


@router.post("/{modulo_id}/resumen", status_code=status.HTTP_200_OK)
async def generar_resumen(
    modulo_id: str,
    user_id: str = Depends(get_current_user_id),
):
    mod_resp = (
        supabase.table("modulo")
        .select("id, nombre")
        .eq("id", modulo_id)
        .single()
        .execute()
    )
    if not mod_resp.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Módulo no encontrado.")

    modulo = mod_resp.data

    temas_resp = (
        supabase.table("tema")
        .select("id")
        .eq("modulo_id", modulo_id)
        .execute()
    )
    if not temas_resp.data:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "El módulo no tiene sub-temas registrados.",
        )

    # Recopila contexto con varias queries complementarias
    todos_los_chunks: list = []
    vistos: set[str] = set()
    queries = [
        "conceptos fundamentales definiciones ERP",
        "implementación práctica y aplicación empresarial",
        "beneficios riesgos factores críticos de éxito",
    ]
    for q in queries:
        chunks = recuperar_contexto(q, tema_id=None, top_k=5, umbral=0.25)
        for c in chunks:
            if c.id not in vistos:
                todos_los_chunks.append(c)
                vistos.add(c.id)

    if not todos_los_chunks:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "No hay contenido indexado suficiente para generar el resumen. "
            "Procesá los documentos del módulo primero.",
        )

    todos_los_chunks.sort(key=lambda c: c.similitud, reverse=True)
    contexto = construir_contexto_texto(todos_los_chunks[:12], max_chars=8000)

    messages = [
        {"role": "system", "content": _PROMPT_RESUMEN_SISTEMA},
        {"role": "user", "content": _PROMPT_RESUMEN_USUARIO.format(
            nombre=modulo["nombre"],
            contexto=contexto,
        )},
    ]

    try:
        resumen = completar(messages, temperature=0.5, max_tokens=700)
    except LLMError as e:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            f"El asistente no está disponible: {e}",
        )

    supabase.table("modulo").update({
        "resumen_ia": resumen.strip(),
        "resumen_generado_en": "now()",
    }).eq("id", modulo_id).execute()

    logger.info("[MODULOS] Resumen generado para módulo %s", modulo_id)
    return {"resumen_ia": resumen.strip()}
