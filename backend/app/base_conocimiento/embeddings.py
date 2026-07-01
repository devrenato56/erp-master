from __future__ import annotations

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


def generar_embedding(texto: str) -> list[float]:
    """Genera un vector de 384 dimensiones para un texto."""
    vector: np.ndarray = _get_model().encode(texto, convert_to_numpy=True)
    return vector.tolist()


def generar_embeddings(textos: list[str]) -> list[list[float]]:
    """
    Genera embeddings para una lista de textos en una sola pasada (batch).
    Más eficiente que llamar a generar_embedding() en un loop.
    """
    if not textos:
        return []
    vectores: np.ndarray = _get_model().encode(textos, convert_to_numpy=True, batch_size=64)
    return vectores.tolist()
