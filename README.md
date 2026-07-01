# ChatERP — Asistente de capacitación en sistemas ERP

Asistente conversacional basado en RAG (Retrieval-Augmented Generation) para capacitar a usuarios en el uso de sistemas ERP. Desarrollado como complemento tecnológico para la feria de proyectos del trabajo de investigación *"Gestión del cambio y ética profesional en la implementación de sistemas ERP"* (Grupo 3 — UNI).

---

## Descripción

El sistema permite seleccionar un tema ERP (módulos, gestión del cambio, buenas prácticas, terminología) y conversar con un asistente que responde basándose exclusivamente en una base de conocimiento curada. Genera evaluaciones automáticas con tres tipos de pregunta, calificación inmediata y retroalimentación cualitativa vía LLM.

El proyecto nace de una hipótesis central de la investigación: la capacitación influye positivamente en el desempeño operativo durante la implementación de un ERP. El chatbot es un prototipo aplicado de esa hipótesis.

## Funcionalidades

- **Chat RAG**: respuestas limitadas al tema seleccionado, rechazo controlado de preguntas fuera de alcance.
- **Base de conocimiento**: temas predefinidos + documentos propios del usuario (PDF, DOCX, TXT, MD).
- **Moderación automática**: documentos compartidos pasan por validación LLM antes de unirse a la base general.
- **Evaluaciones**: generación automática con opción múltiple, verdadero/falso y preguntas abiertas. Corrección automática + calificación LLM con feedback para preguntas abiertas. Puntaje en escala 0–20.
- **Perfil de usuario**: historial de sesiones, evaluaciones y documentos. Edición de nombre inline.
- **Plan B offline**: Supabase CLI local + Ollama como fallback completo sin internet.

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript |
| Backend | Python 3.11+ / FastAPI |
| Embeddings | `sentence-transformers` — `all-MiniLM-L6-v2` (384 dims, local, gratuito) |
| LLM | Groq API — `llama-3.3-70b-versatile` (plan A) / Ollama local (plan B) |
| OCR / extracción PDF | Gemini Vision (Google AI Studio) con `pypdf` como fallback |
| Base de datos | Supabase (PostgreSQL + pgvector + Auth + Storage) |
| Búsqueda vectorial | pgvector con índice HNSW (`vector_cosine_ops`) |
| Hosting frontend | Vercel |
| Hosting backend | Render / Railway |

**Sin modelos de IA de pago.** Todos los componentes de IA usan opciones gratuitas o locales.

---

## Estructura del repositorio

```
chatbot-erp/
├── frontend/                        # Aplicación Next.js
│   ├── app/
│   │   ├── (auth)/                  # Login y registro
│   │   └── (protected)/             # Rutas autenticadas
│   │       ├── dashboard/
│   │       ├── chat/
│   │       │   └── [sesionId]/
│   │       ├── evaluaciones/
│   │       │   └── [intentoId]/
│   │       │       └── resultados/
│   │       ├── documentos/
│   │       └── perfil/
│   ├── components/
│   │   └── sidebar.tsx
│   ├── lib/
│   │   ├── api.ts                   # Cliente HTTP con auth headers
│   │   ├── use-breakpoint.ts        # Hook responsive (mobile/tablet/desktop)
│   │   └── supabase/                # Cliente Supabase (anon key)
│   ├── .env.local.example
│   └── package.json
│
├── backend/                         # API FastAPI
│   ├── app/
│   │   ├── chat/                    # RAG: retriever + service + router
│   │   ├── evaluaciones/            # Generación, calificación y resultados
│   │   ├── base_conocimiento/       # Ingesta, chunking, embeddings, moderación
│   │   ├── temas/                   # Catálogo de temas
│   │   ├── perfil/                  # Perfil de usuario y progreso
│   │   └── core/
│   │       ├── config.py            # Variables de entorno (pydantic-settings)
│   │       ├── auth.py              # Validación JWT
│   │       ├── supabase_client.py   # Cliente service_role (solo backend)
│   │       └── llm_provider.py      # Selector Groq / Ollama con reintentos
│   ├── .env.example
│   └── requirements.txt
│
├── sql/
│   ├── 01_schema_chatbot_erp.sql    # Schema completo: tablas, índices, RLS, trigger
│   ├── 02_rls_fix_autenticados.sql  # Fix RLS: docs compartidos solo a autenticados
│   ├── 03_match_chunks_function.sql # Función SQL de búsqueda vectorial (HNSW)
│   ├── 04_rls_evaluaciones_verif.sql# Recrear y verificar políticas de evaluaciones
│   └── 05_escalabilidad_explain.sql # EXPLAIN ANALYZE para auditar uso del índice HNSW
│
├── scripts/
│   └── seed_demo.py                 # Semilla de datos para la demo (usuario + historial)
│
└── docs/
    ├── REQUIREMENTS.md              # Requerimientos funcionales y no funcionales
    ├── fases-proyecto.md            # Estado de avance por fases
    ├── contingencia-plan-b.md       # Instrucciones plan B + checklist día de feria
    ├── diagrama_er_chatbot_erp.html # Diagrama entidad-relación interactivo
    └── AGENTS.md                    # Instrucciones para agentes IA del proyecto
```

---

## Puesta en marcha

### Prerequisitos

- Node.js 18+
- Python 3.11+
- Cuenta de [Supabase](https://supabase.com) (gratuita)
- Cuenta de [Groq](https://console.groq.com) (gratuita) para el LLM

### 1. Base de datos (Supabase)

En el Dashboard de Supabase → **SQL Editor → New query**, ejecutar en orden:

```sql
-- 1. Schema completo (tablas, índices HNSW, trigger de auth, RLS)
-- Pegar contenido de sql/01_schema_chatbot_erp.sql

-- 2. Función de búsqueda vectorial
-- Pegar contenido de sql/03_match_chunks_function.sql

-- 3. (Opcional) Fix RLS para docs compartidos
-- Pegar contenido de sql/02_rls_fix_autenticados.sql
```

Copiar de **Settings → API**: `URL`, `anon key` y `service_role key`.

### 2. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # Linux/Mac

pip install -r requirements.txt

cp .env.example .env        # Completar con credenciales reales

uvicorn app.main:app --reload --port 8000
```

API disponible en `http://localhost:8000` — documentación interactiva en `http://localhost:8000/docs`.

### 3. Frontend

```bash
cd frontend
npm install

cp .env.local.example .env.local   # Completar con URL y anon key de Supabase

npm run dev
```

Frontend disponible en `http://localhost:3000`.

### 4. Variables de entorno

**`backend/.env`**:
```
SUPABASE_URL=https://<proyecto>.supabase.co
SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>

LLM_PROVIDER=groq
GROQ_API_KEY=<tu Groq API key>
GROQ_MODEL=llama-3.3-70b-versatile

EMBEDDING_MODEL=all-MiniLM-L6-v2

GEMINI_API_KEY=<tu Gemini key>
GEMINI_MODEL=gemini-2.5-flash
```

**`frontend/.env.local`**:
```
NEXT_PUBLIC_SUPABASE_URL=https://<proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> `service_role` solo va en el backend. Nunca en el frontend.

### 5. Semilla de datos para demo

```bash
cd backend
python ../scripts/seed_demo.py
```

Crea el usuario `demo@chaterp.test` / `Demo1234!` con historial preexistente. Ver `docs/contingencia-plan-b.md` para instrucciones completas.

---

## Plan de contingencia (feria sin internet)

Ver `docs/contingencia-plan-b.md` para instrucciones detalladas de:
- Instalar Supabase CLI + Docker Desktop para instancia local.
- Configurar Ollama con `llama3.1:8b` como LLM local.
- Cambiar entre Plan A (nube) y Plan B (local) en < 3 minutos.
- Checklist del día de la feria.

---

## Seguridad

- `service_role` key solo en backend; nunca expuesta al frontend.
- Todas las rutas de datos requieren JWT válido (`Depends(get_current_user_id)`).
- RLS activo en todas las tablas; el backend usa service_role con filtros explícitos por `usuario_id`.
- Filtro de prompt injection en el pipeline de chat (14 patrones regex con lookaheads negativos).
- Secretos en variables de entorno; `.env` y `.env.*` en `.gitignore`.

## Estado del proyecto

Prototipo académico. 9 fases completadas. Ver [`docs/fases-proyecto.md`](docs/fases-proyecto.md) para el historial completo de implementación.
