# Plan de contingencia — Demo sin internet (Plan B)

Este documento describe cómo activar el sistema completo en local si el internet falla el día de la feria. Guardarlo también en el teléfono.

---

## Prerequisitos (hacer con anticipación, no el día de la feria)

### 1. Docker Desktop
Requerido por Supabase CLI. Instalar desde https://www.docker.com/products/docker-desktop y verificar que corre correctamente:
```
docker --version
```

### 2. Supabase CLI
```
# Windows (PowerShell como administrador)
winget install Supabase.CLI
# o desde https://supabase.com/docs/guides/cli
supabase --version
```

### 3. Inicializar Supabase local (una sola vez)
Desde la raíz del repositorio:
```
supabase init
supabase start
```
Anotar las credenciales que devuelve `supabase start`:
- `API URL`         → va a `SUPABASE_URL` del `.env.plan-b`
- `anon key`        → va a `SUPABASE_ANON_KEY` del `.env.plan-b`
- `service_role key`→ va a `SUPABASE_SERVICE_ROLE_KEY` del `.env.plan-b`

### 4. Aplicar el schema
```
supabase db reset
```
Aplica `sql/01_schema_chatbot_erp.sql` automáticamente. Verificar que no hay errores.

### 5. Ollama
Instalar desde https://ollama.com/download (Windows).
Descargar el modelo (requiere internet — hacer en casa):
```
ollama pull llama3.1:8b
ollama list    # confirmar que aparece
```
Medir el tiempo de respuesta en la laptop de presentación:
```
ollama run llama3.1:8b "Explica brevemente qué es un sistema ERP"
```
Si supera 25 segundos, usar el modelo más liviano:
```
ollama pull llama3.2:3b
```

### 6. Crear los archivos .env de cada plan

**`backend/.env.plan-a`** (nube + Groq):
```
SUPABASE_URL=<URL de Supabase nube>
SUPABASE_ANON_KEY=<anon key nube>
SUPABASE_SERVICE_ROLE_KEY=<service_role key nube>
LLM_PROVIDER=groq
GROQ_API_KEY=<tu Groq API key>
GROQ_MODEL=llama-3.3-70b-versatile
EMBEDDING_MODEL=all-MiniLM-L6-v2
GEMINI_API_KEY=<tu Gemini key>
GEMINI_MODEL=gemini-2.5-flash
```

**`backend/.env.plan-b`** (local + Ollama):
```
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<anon key local de supabase start>
SUPABASE_SERVICE_ROLE_KEY=<service_role key local de supabase start>
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
EMBEDDING_MODEL=all-MiniLM-L6-v2
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```

> Ambos archivos están en `.gitignore` — nunca se commitean.

### 7. Cargar datos de semilla en ambos entornos
Con el `.env` de plan A activo:
```
cd backend && python ../scripts/seed_demo.py
```
Cambiar a plan B y repetir:
```
copy .env.plan-b .env
python ../scripts/seed_demo.py
```

### 8. Probar el cambio completo (ensayo cronometrado)
Objetivo: < 3 minutos de plan A a plan B con internet desconectado.

---

## Checklist del día de la feria

### Plan A — Con internet (modo normal)

```
[ ] Confirmar conexión a internet.
[ ] cd backend
[ ] venv\Scripts\activate.bat
[ ] copy .env.plan-a .env
[ ] uvicorn app.main:app --port 8000
[ ] (otra terminal) cd frontend && npm run dev
[ ] Abrir http://localhost:3000
[ ] Login con demo@chaterp.test / Demo1234!
[ ] Confirmar: chat responde, perfil muestra historial.
[ ] Laptop cargada + cargador disponible.
```

### Plan B — Sin internet (contingencia)

```
[ ] supabase start          (esperar ~30 seg)
[ ] ollama serve            (dejar corriendo en segundo plano)
[ ] cd backend
[ ] venv\Scripts\activate.bat
[ ] copy .env.plan-b .env
[ ] uvicorn app.main:app --port 8000
[ ] (otra terminal) cd frontend && npm run dev
[ ] Abrir http://localhost:3000
[ ] Login con demo@chaterp.test / Demo1234!
[ ] Confirmar: chat responde desde Ollama local.
```

> El frontend no requiere ningún cambio entre plan A y plan B — siempre apunta a `localhost:8000`.

---

## Guión de la demo (8–11 minutos)

| Paso | Acción | Tiempo estimado | Nota |
|------|--------|----------------|------|
| 1 | Registro de usuario nuevo en vivo | 30 seg | Mostrar que el sistema no requiere configuración previa |
| 2 | Selección de tema + 3 turnos de chat sobre ERP | 2–3 min | Elegir un tema con documentos cargados (predefinidos) |
| 3 | Generación de evaluación (8 preguntas) + responder | 3–4 min | Mencionar la arquitectura RAG mientras espera el LLM |
| 4 | Ver perfil con historial y puntaje obtenido | 1 min | Mostrar las 3 secciones: sesiones, evaluaciones, stats |
| 5 | (Opcional) Subir un documento y chatear sobre él | 2 min | Solo si el tiempo lo permite |

**Momentos de espera previstos:**
- Generación de evaluación: 4–7 segundos (Groq) / hasta 30 segundos (Ollama). Hablar sobre la arquitectura RAG durante la espera.
- Primera carga del modelo de embeddings: ~3 segundos solo en el primer request tras arrancar el backend.

---

## Notas finales

- No hacer commits ni cambios de código el día de la feria.
- Tener el repositorio en el commit estable del día anterior.
- Si Groq devuelve rate-limit durante la demo, el backend reintenta automáticamente (máx. 2 reintentos con backoff 2s/4s) — esperar sin reiniciar.
- Si el chat devuelve "sin contexto relevante", verificar que hay documentos aprobados para ese tema en el Dashboard de Supabase.
