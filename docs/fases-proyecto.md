# Estado de fases — ChatERP

Registro del avance por fases del proyecto.

| Fase | Descripción | Estado |
|---|---|---|
| 0 | Setup inicial (repo, estructura, SQL, variables de entorno) | ✅ Completada |
| 1 | (reservada / fusionada con Fase 2) | — |
| 2 | Backend base + autenticación (FastAPI, Supabase Auth, JWT, frontend auth) | ✅ Completada |
| 3 | Base de conocimiento: ingesta de documentos (extracción, chunking, embeddings, moderación, endpoints, seed, frontend) | ✅ Completada |
| 4 | Chat conversacional con RAG | ✅ Completada |
| 5 | Evaluaciones (generación, calificación automática) | 🔲 Pendiente |
| 6 | Perfil de usuario e historial | 🔲 Pendiente |
| 7 | Polish / landing page / UX final | 🔲 Pendiente |
| 8 | Contingencia y plan B (Ollama, Supabase local) | 🔲 Pendiente |
| 9 | Documentación final y entrega | 🔲 Pendiente |

## Notas por fase

### Fase 4 — Completada

- RAG completo: retriever con pgvector (`match_chunks` HNSW coseno, umbral 0.50) → servicio de chat → Groq `llama-3.3-70b-versatile`.
- 4 endpoints REST: `POST /chat/sesiones`, `POST /chat/sesiones/{id}/mensajes`, `GET /chat/sesiones`, `GET /chat/sesiones/{id}/mensajes`.
- Control de proveedor LLM vía env var (`LLM_PROVIDER=groq|ollama`), modelos configurables, `LLMError` tipada.
- Retry con backoff exponencial (máx 2 reintentos ante timeout), logging de tokens y tiempo por llamada.
- Frontend: selector de temas (`/chat`) + interfaz editorial de conversación (`/chat/[sesionId]`) con scroll automático, optimistic UI y manejo de error inline.
- RLS verificado: sesiones y mensajes aislados por usuario (HTTP 403 ante acceso cruzado).
- Tiempo de respuesta verificado: promedio 2.7s, máximo 4.8s — cumple RNF-01 (≤ 8s).
- Rechazo off-topic: 6/6 preguntas no relacionadas a ERP rechazadas correctamente (umbral 0.50).
- **Pendiente aplicar en Supabase Dashboard**: `sql/02_rls_fix_autenticados.sql` — restringe acceso anon a docs compartidos+aprobados.

### Fase 3 — Completada
- Pipeline completo: extracción (Gemini Vision + fallback pypdf) → chunking (1600 chars/chunk, 300 overlap) → embeddings (all-MiniLM-L6-v2, 384 dims) → moderación automática (Groq llama-3.3-70b) → Supabase (tabla chunk con pgvector).
- 5 temas predefinidos seeded con contenido real del PDF de investigación UNI (119 chunks).
- Frontend: sidebar de navegación + página de gestión de documentos (subir / listar / eliminar).
- **Pendiente aplicar en Supabase Dashboard**: `sql/02_rls_fix_autenticados.sql` — ajusta las políticas RLS de `documento` y `chunk` para restringir docs `compartido+aprobado` a usuarios autenticados (actualmente también visibles al rol anon).
