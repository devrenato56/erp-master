# Implementaciones — Fase 7: Endurecimiento (RNF) y pulido de UI

---

## Bloque 1 — Rendimiento (RNF-01, RNF-02, RNF-03)

### Verificaciones

**Singleton del modelo `all-MiniLM-L6-v2` (RNF-03)**

Ya implementado correctamente en `backend/app/base_conocimiento/embeddings.py`:
- `_model: SentenceTransformer | None = None` — variable global de módulo.
- `_get_model()` — crea el modelo solo si es `None`; en uvicorn el módulo se importa una vez y el objeto persiste durante toda la vida del proceso.
- `generar_embeddings()` — usa `batch_size=64` para procesar lotes de chunks en una sola pasada (evita N llamadas al modelo).
- No se detectó ningún patrón de carga por request. ✅

**Historial de chat limitado (RNF-17/costos)**

`chat/service.py` — `MAX_TURNOS_HISTORIAL = 6`: el prompt incluye `historial[-(6 * 2):]` = últimos 12 mensajes como máximo. No crece sin control en conversaciones largas. ✅

**Contexto retriever limitado (RNF-17/costos)**

`chat/retriever.py` — `construir_contexto_texto(max_chars=6000)`: corta el contexto al superar 6000 chars. El evaluador usa `max_chars=7000`. Ambos dentro de límites razonables. ✅

**Tiempos medidos en fases anteriores**

| Operación | Tiempo medido | Límite RNF |
|---|---|---|
| Chat RAG (promedio) | 2.7s | ≤ 8s (RNF-01) ✅ |
| Chat RAG (máximo) | 4.8s | ≤ 8s (RNF-01) ✅ |
| Generación evaluación 6 preguntas | ~7.2s | ≤ 15s (RNF-02) ✅ |
| Generación evaluación 8 preguntas | ~4s | ≤ 15s (RNF-02) ✅ |

No se identificaron cuellos de botella que requieran optimización.

### Mejora implementada: caché de embeddings de queries

**`backend/app/base_conocimiento/embeddings.py`** — modificado.

```python
@functools.lru_cache(maxsize=256)
def _embedding_cached(texto: str) -> tuple[float, ...]:
    vector = _get_model().encode(texto, convert_to_numpy=True)
    return tuple(vector.tolist())

def generar_embedding(texto: str) -> list[float]:
    return list(_embedding_cached(texto))
```

- `lru_cache(maxsize=256)`: hasta 256 queries distintas en memoria (≈ 256 × 384 floats ≈ 400 KB — negligible).
- Guarda como `tuple` (inmutable): cada caller recibe su propia copia `list()` — no hay riesgo de mutación compartida.
- En demo con queries repetidas (mismo usuario repregunta, o el jurado hace la misma pregunta): **0ms** en lugar de ~200-400ms de `encode()`.

### Verificación

```
Primera llamada : 3375.4 ms  (carga modelo + encode)
Segunda llamada : 0.0 ms     (cache hit)
Cache info      : hits=1 misses=1 maxsize=256
Vectores iguales: True
Objetos distintos: True (copia segura)
```
✅
