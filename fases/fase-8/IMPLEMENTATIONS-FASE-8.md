# Implementaciones — Fase 8: Plan de contingencia y ensayo de demo

---

## Naturaleza de la fase

Esta fase no agrega funcionalidad de producto. Su objetivo es reducir el riesgo operativo el día de la feria al mínimo posible mediante:
- Un entorno local completo funcional (plan B) como fallback si hay problemas de internet.
- Datos de demo pre-cargados en ambos entornos para no depender de acciones en vivo frente al jurado.
- Documentación operativa y checklist del día de la feria.

---

## Bloque 1 y 2 — Entorno local: Supabase CLI + Ollama

### Lo que ya estaba listo (sin cambios de código)

**Supabase local:**
- El esquema completo (`sql/01_schema_chatbot_erp.sql`) es compatible con `supabase db reset` — aplica tablas, índices HNSW, trigger de auth y políticas RLS en un solo comando.
- La función `match_chunks` (`sql/03_match_chunks_function.sql`) debe aplicarse manualmente en el SQL Editor de Supabase local tras el reset (no es parte del schema inicial).

**Ollama:**
- El backend ya soporta Ollama desde Fase 4: `LLM_PROVIDER=ollama` en `.env` activa `_completar_ollama()` en `llm_provider.py`.
- `OLLAMA_BASE_URL` y `OLLAMA_MODEL` configurables vía variables de entorno — sin cambios de código.
- Modelo recomendado: `llama3.1:8b`. Alternativa liviana si la laptop es lenta: `llama3.2:3b`.

### Configuración de entornos documentada

Ver `docs/contingencia-plan-b.md` — instrucciones paso a paso para:
- Instalar Docker Desktop y Supabase CLI.
- Levantar instancia local con `supabase start`.
- Aplicar schema con `supabase db reset`.
- Instalar Ollama y descargar modelo con anticipación.
- Crear `backend/.env.plan-a` (nube + Groq) y `backend/.env.plan-b` (local + Ollama).

---

## Bloque 3 — Script de semilla de datos para demo

**`scripts/seed_demo.py`** — creado.

Carga en la base de datos (plan A o plan B, según el `.env` activo):

- **Usuario de demo**: `demo@chaterp.test` / `Demo1234!` — creado vía Supabase Admin API (`auth.admin.create_user`). Si ya existe, no falla.
- **3 sesiones de chat** con mensajes de ejemplo sobre temas ERP (gestión del cambio, módulos, KPIs de éxito) — visibles en el historial del perfil.
- **1 evaluación completada** con 3 preguntas (opción múltiple + verdadero/falso + abierta), respuestas, puntajes y feedback LLM para la pregunta abierta. Puntaje aprobatorio (~15/20).

El script es **idempotente**: verifica si el usuario ya existe antes de crearlo.

**Uso:**
```bash
cd backend
python ../scripts/seed_demo.py
```

**Prerequisito:** los temas predefinidos deben existir (creados en el seed de Fase 3). El script verifica esto y aborta con mensaje claro si la tabla `tema` está vacía.

---

## Bloque 4 — Prueba del cambio Plan A → Plan B

### Tiempo objetivo: < 3 minutos

Secuencia (con `supabase` y `ollama` ya instalados y el modelo descargado):

```
copy backend\.env.plan-b backend\.env       # 5 seg
supabase start                              # ~30 seg (Docker ya corriendo)
ollama serve                                # ~5 seg
uvicorn app.main:app --port 8000            # ~15 seg (carga modelo embeddings)
```

Total estimado: ~60 segundos.

### Lo que NO cambia en el frontend

`NEXT_PUBLIC_API_URL=http://localhost:8000` — idéntico en plan A (dev local) y plan B. El frontend no requiere ningún ajuste al cambiar de plan.

---

## Bloques 5 y 6 — Ensayo de demo (Plan A y Plan B)

### Guión definido (8–11 minutos)

| Paso | Acción | Tiempo |
|------|--------|--------|
| 1 | Registro de usuario nuevo en vivo | 30 seg |
| 2 | Selección de tema + 3 turnos de chat | 2–3 min |
| 3 | Generación de evaluación + responder | 3–4 min |
| 4 | Perfil: historial, stats, puntaje | 1 min |
| 5 | (Opcional) Subida de documento + chat | 2 min |

**Manejo de esperas:**
- Generación de evaluación (4–7s en Groq, hasta 30s en Ollama): comentar la arquitectura RAG (retriever → embeddings → LLM) durante la espera.
- Primera request tras arrancar el backend: ~3s de carga del modelo `all-MiniLM-L6-v2`.

### Diferencias entre Plan A y Plan B en la demo

| Aspecto | Plan A (Groq) | Plan B (Ollama) |
|---|---|---|
| Tiempo de respuesta chat | 2–5s | 10–30s (depende de la laptop) |
| Calidad de respuestas | Alta (llama-3.3-70b) | Buena (llama3.1:8b) |
| Generación de evaluación | 4–7s | 20–60s |
| Dependencia de red | Sí (Groq API) | No |

Si Ollama es demasiado lento en la laptop de presentación, usar `llama3.2:3b` como alternativa más liviana.

---

## Bloque 7 — Checklist del día de la feria

Ver `docs/contingencia-plan-b.md` — sección "Checklist del día de la feria".

Incluye checklists separados para Plan A y Plan B, cada uno con los comandos exactos en orden.

---

## Bloque 8 — Cierre de fase

### Artefactos creados

| Archivo | Descripción |
|---|---|
| `scripts/seed_demo.py` | Script de semilla: usuario demo + sesiones + evaluación |
| `docs/contingencia-plan-b.md` | Instrucciones plan B + checklist día de feria + guión demo |
| `fases/fase-8/IMPLEMENTATIONS-FASE-8.md` | Este archivo |

### Condición de salida verificable

- [ ] `supabase start` levanta sin errores en la laptop de presentación.
- [ ] `supabase db reset` aplica el schema completo.
- [ ] `ollama list` muestra `llama3.1:8b` descargado.
- [ ] `python scripts/seed_demo.py` termina sin errores en plan A y plan B.
- [ ] Login con `demo@chaterp.test` / `Demo1234!` muestra perfil con historial.
- [ ] Cambio Plan A → Plan B en < 3 minutos cronometrado.
- [ ] Ensayo completo ejecutado al menos 2 veces (plan A y plan B).
