# Estado de fases — ChatERP

Registro del avance por fases del proyecto.

| Fase | Descripción | Estado |
|---|---|---|
| 0 | Setup inicial (repo, estructura, SQL, variables de entorno) | ✅ Completada |
| 1 | (reservada / fusionada con Fase 2) | — |
| 2 | Backend base + autenticación (FastAPI, Supabase Auth, JWT, frontend auth) | ✅ Completada |
| 3 | Base de conocimiento: ingesta de documentos (extracción, chunking, embeddings, moderación, endpoints, seed, frontend) | ✅ Completada |
| 4 | Chat conversacional con RAG | 🔲 Pendiente |
| 5 | Evaluaciones (generación, calificación automática) | 🔲 Pendiente |
| 6 | Perfil de usuario e historial | 🔲 Pendiente |
| 7 | Polish / landing page / UX final | 🔲 Pendiente |
| 8 | Contingencia y plan B (Ollama, Supabase local) | 🔲 Pendiente |
| 9 | Documentación final y entrega | 🔲 Pendiente |

## Notas por fase

### Fase 3 — Completada
- Pipeline completo: extracción (Gemini Vision + fallback pypdf) → chunking (1600 chars/chunk, 300 overlap) → embeddings (all-MiniLM-L6-v2, 384 dims) → moderación automática (Groq llama-3.3-70b) → Supabase (tabla chunk con pgvector).
- 5 temas predefinidos seeded con contenido real del PDF de investigación UNI (119 chunks).
- Frontend: sidebar de navegación + página de gestión de documentos (subir / listar / eliminar).
- **Pendiente aplicar en Supabase Dashboard**: `sql/02_rls_fix_autenticados.sql` — ajusta las políticas RLS de `documento` y `chunk` para restringir docs `compartido+aprobado` a usuarios autenticados (actualmente también visibles al rol anon).
