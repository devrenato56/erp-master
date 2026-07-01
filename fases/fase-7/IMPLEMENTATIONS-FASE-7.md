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

---

## Bloque 2 — Seguridad (RNF-04, RNF-05, RNF-06, RNF-07, RNF-08)

### Verificaciones (sin cambios de código)

**Historial de Git — ningún secreto commiteado (RNF-05)**

`git log --all --full-history -- "**/.env"` devolvió 3 commits, todos sobre `backend/.env.example` (valores vacíos). Los archivos `backend/.env` y `frontend/.env.local` con valores reales nunca aparecen en el historial. ✅

**`service_role` solo en backend (RNF-05/06)**

`grep -r "service_role"` sobre `frontend/` → 0 resultados. Solo aparece en:
- `backend/app/core/config.py` (lectura desde variable de entorno)
- `backend/app/core/supabase_client.py` (instancia del cliente)
No está hardcodeado en ningún lado. ✅

**JWT requerido en todos los endpoints de datos (RNF-06)**

Auditados los 6 routers. Todos los endpoints que devuelven o modifican datos de usuario tienen `Depends(get_current_user_id)`. El único endpoint público es `GET /health`. ✅

**Contraseñas gestionadas por Supabase Auth (RNF-04)**

El backend nunca recibe ni almacena contraseñas. No existe ningún endpoint `/auth/login` ni `/auth/register` en el backend — el auth ocurre directamente en el cliente Supabase del frontend. ✅

**Validación de archivos en `POST /documentos` (RNF-08)**

Implementado desde Fase 3: extensión extraída de `Path(nombre).suffix` (no del `content-type` reportado por el cliente), `FORMATOS_PERMITIDOS`, `TAMANO_MAXIMO_BYTES = 10 MB`, ambos con 422 y mensaje claro. ✅

**HTTPS (RNF-07)**

Vercel (frontend) y Render/Railway (backend): TLS activo por defecto en todos los dominios. ✅

### Cambios implementados

**Filtro de prompt injection — `backend/app/chat/service.py`**

```python
_INJECTION_PATTERNS = re.compile(
    r"ignora\s+(todas\s+)?las?\s+instrucciones"
    r"|ignore\s+(all\s+)?(previous\s+)?instructions"
    r"|disregard\s+(all\s+)?previous"
    r"|you\s+are\s+now\s+(?!an?\s+ERP)"
    r"|pretend\s+(you\s+are|to\s+be)"
    r"|system\s*:\s*"
    r"|<\s*/?system\s*>",
    re.IGNORECASE,
)
```

- Ejecutado antes del retriever y del LLM — costo cero si se detecta.
- Detectado → `RespuestaChat(fuera_de_alcance=True)` con mensaje amigable, sin llamar al LLM.
- Logea `WARNING` con los primeros 120 chars del mensaje.
- Lookahead negativo evita falsos positivos en frases legítimas.

Casos verificados: 6/6 ataques detectados, 3/3 mensajes legítimos que pasan limpio. ✅

**`.gitignore` reforzado**

- `backend/.env.*` + `frontend/.env` + `frontend/.env.*` con excepciones `!*.env.example`.
- `backend/**/__pycache__/`, `*.pyc`, `.DS_Store`, `Thumbs.db`.
