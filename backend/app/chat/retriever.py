from __future__ import annotations

import logging
from dataclasses import dataclass

from app.core.supabase_client import supabase
from app.base_conocimiento.embeddings import generar_embedding

logger = logging.getLogger(__name__)

# Umbral mínimo de similitud coseno (0.0 – 1.0).
# Por debajo de este valor, el chunk no se considera relevante para la pregunta.
# Un valor de 0.0 devuelve todo; 1.0 solo devuelve coincidencias exactas.
UMBRAL_SIMILITUD = 0.50


@dataclass
class ChunkRecuperado:
    id: str
    documento_id: str
    contenido: str
    orden: int
    similitud: float


def recuperar_contexto(
    query: str,
    tema_id: str | None,
    top_k: int = 5,
    umbral: float = UMBRAL_SIMILITUD,
) -> list[ChunkRecuperado]:
    """
    Busca los top_k chunks más relevantes para `query` en la base de conocimiento.

    Estrategia A: busca en TODOS los documentos con estado_moderacion='aprobado',
    sin filtrar por tema_id. Esto permite que el corpus compartido/predefinido
    esté disponible para todos los temas, aunque el documento haya sido indexado
    bajo un único tema_id.

    El parámetro tema_id se conserva en la firma para trazabilidad en los logs
    y para futura implementación de la Estrategia B (filtro por tema).

    Pasos:
    1. Genera el embedding de la pregunta del usuario.
    2. Llama a match_chunks con p_tema_id=None (todos los docs aprobados).
    3. Devuelve lista ordenada de mayor a menor similitud.
    """
    # 1. Embedding de la query
    vector = generar_embedding(query)

    # 2. Búsqueda vectorial vía RPC — p_tema_id=None para buscar en todo el corpus aprobado
    try:
        resp = supabase.rpc(
            "match_chunks",
            {
                "query_embedding": vector,
                "match_threshold": umbral,
                "match_count": top_k,
                "p_tema_id": None,
            },
        ).execute()
    except Exception as e:
        logger.error("Error en búsqueda vectorial (match_chunks): %s", e)
        return []

    if not resp.data:
        return []

    # 3. Mapear a dataclass y ordenar por similitud descendente
    chunks = [
        ChunkRecuperado(
            id=row["id"],
            documento_id=row["documento_id"],
            contenido=row["contenido"],
            orden=row["orden"],
            similitud=float(row["similarity"]),
        )
        for row in resp.data
    ]
    chunks.sort(key=lambda c: c.similitud, reverse=True)

    logger.info(
        "Retriever: query=%r tema=%s (sin filtro tema) → %d chunks (umbral=%.2f)",
        query[:60],
        tema_id,
        len(chunks),
        umbral,
    )

    return chunks


def recuperar_contexto_caso(
    query: str,
    documento_id: str,
    top_k: int = 5,
    umbral: float = UMBRAL_SIMILITUD,
) -> list[ChunkRecuperado]:
    """
    Recupera contexto combinado para el chat de un caso de empresa:
    - Busca en el documento específico del caso (sin filtro de moderación).
    - Busca en el corpus general aprobado (igual que recuperar_contexto).
    - Fusiona resultados deduplicando por id, priorizando chunks del documento del caso.

    El usuario definió que el chat de un caso usa el documento subido + toda la
    base de conocimiento, relacionando el caso concreto con el saber general.
    """
    vector = generar_embedding(query)

    # 1. Chunks del documento específico del caso (sin filtro de estado_moderacion)
    chunks_caso: list[ChunkRecuperado] = []
    try:
        resp_caso = supabase.rpc(
            "match_chunks_by_documento",
            {
                "query_embedding": vector,
                "p_documento_id": documento_id,
                "match_threshold": max(umbral - 0.10, 0.20),  # umbral más bajo para el doc propio
                "match_count": top_k,
            },
        ).execute()
        chunks_caso = [
            ChunkRecuperado(
                id=row["id"],
                documento_id=row["documento_id"],
                contenido=row["contenido"],
                orden=row["orden"],
                similitud=float(row["similarity"]),
            )
            for row in (resp_caso.data or [])
        ]
    except Exception as e:
        logger.error("Error buscando en documento del caso %s: %s", documento_id, e)

    # 2. Corpus general aprobado
    chunks_generales = recuperar_contexto(query, tema_id=None, top_k=top_k, umbral=umbral)

    # 3. Fusión — los chunks del caso van primero (mayor prioridad en el contexto)
    vistos: set[str] = set()
    resultado: list[ChunkRecuperado] = []
    for c in chunks_caso:
        if c.id not in vistos:
            resultado.append(c)
            vistos.add(c.id)
    for c in chunks_generales:
        if c.id not in vistos:
            resultado.append(c)
            vistos.add(c.id)

    logger.info(
        "Retriever caso: documento=%s → %d chunks (caso=%d, general=%d)",
        documento_id, len(resultado), len(chunks_caso), len(chunks_generales),
    )
    return resultado


def construir_contexto_texto(chunks: list[ChunkRecuperado], max_chars: int = 6000) -> str:
    """
    Concatena los chunks recuperados en un bloque de texto para el prompt.
    Respeta un límite de caracteres para no exceder el context window del LLM.
    Cada chunk va separado con un divisor claro para que el LLM los distinga.
    """
    partes: list[str] = []
    total = 0

    for i, chunk in enumerate(chunks, 1):
        bloque = f"[Fragmento {i}]\n{chunk.contenido.strip()}"
        if total + len(bloque) > max_chars:
            break
        partes.append(bloque)
        total += len(bloque)

    return "\n\n".join(partes)
