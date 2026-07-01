from __future__ import annotations

import functools
import numpy as np
from sentence_transformers import SentenceTransformer

from app.core.config import settings

EMBEDDING_DIM = 384

# Singleton: el modelo se carga una sola vez al importar el módulo
_model: SentenceTransformer | None = None


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(settings.embedding_model)
    return _model


@functools.lru_cache(maxsize=256)
def _embedding_cached(texto: str) -> tuple[float, ...]:
    """Cache LRU de hasta 256 queries distintas (≈ 256 × 384 × 4B ≈ 400 KB).
    Guarda como tupla (inmutable) para que lru_cache no comparta el objeto con callers."""
    vector: np.ndarray = _get_model().encode(texto, convert_to_numpy=True)
    return tuple(vector.tolist())


def generar_embedding(texto: str) -> list[float]:
    """Genera un vector de 384 dimensiones para un texto.
    Las queries repetidas se resuelven desde caché en memoria (~0ms vs ~200ms)."""
    return list(_embedding_cached(texto))


def generar_embeddings(textos: list[str]) -> list[list[float]]:
    """
    Genera embeddings para una lista de textos en una sola pasada (batch).
    Más eficiente que llamar a generar_embedding() en un loop.
    """
    if not textos:
        return []
    vectores: np.ndarray = _get_model().encode(textos, convert_to_numpy=True, batch_size=64)
    return vectores.tolist()
