# Fase 8 — Plan de contingencia y ensayo de feria

Desglose de tareas para garantizar que el sistema funciona sin internet si es necesario, y que el equipo está preparado para ejecutar la demo en vivo sin imprevistos. Esta fase no agrega código nuevo de producto — su objetivo es reducir el riesgo operativo el día de la feria al mínimo posible.

Depende de que la Fase 7 esté completa y el sistema esté estable. Debe ejecutarse con suficiente anticipación (mínimo 3-4 días antes de la feria, no la noche anterior).

---

## 1. Preparación del entorno local completo (plan B)

- [ ] Instalar Supabase CLI en la laptop de presentación si no está instalado: seguir la guía oficial en `https://supabase.com/docs/guides/cli`.
- [ ] Confirmar que Docker Desktop está instalado y corriendo correctamente en la laptop — Supabase CLI lo requiere para levantar la instancia local.
- [ ] Levantar la instancia local de Supabase por primera vez:
  ```cmd
  supabase init
  supabase start
  ```
- [ ] Aplicar el esquema de base de datos a la instancia local:
  ```cmd
  supabase db reset
  ```
  Esto ejecuta automáticamente el script `sql/01_schema_chatbot_erp.sql`. Confirmar que todas las tablas, índices, trigger y políticas RLS se crean sin errores.
- [ ] Anotar las credenciales que devuelve `supabase start` (URL local, anon key local, service_role key local) — son distintas a las de la nube.
- [ ] Crear un archivo `.env.local-plan-b` (no commitearlo) con las credenciales de la instancia local, listo para intercambiar con el `.env` de producción si es necesario.

**Verificación de bloque:** `supabase start` levanta sin errores, `supabase db reset` aplica el esquema completo, y el backend conecta correctamente apuntando a la instancia local.

---

## 2. Instalación y configuración de Ollama (plan B)

- [ ] Instalar Ollama en la laptop de presentación desde `https://ollama.com/download` (Windows).
- [ ] Descargar el modelo con anticipación (requiere internet — hacerlo en casa, no el día de la feria):
  ```cmd
  ollama pull llama3.1:8b
  ```
- [ ] Confirmar que el modelo se descargó correctamente:
  ```cmd
  ollama list
  ```
- [ ] Levantar Ollama en segundo plano:
  ```cmd
  ollama serve
  ```
- [ ] Probar una llamada de prueba al modelo local para confirmar que responde:
  ```cmd
  ollama run llama3.1:8b "Explica brevemente qué es un sistema ERP"
  ```
- [ ] Medir el tiempo de respuesta de Ollama local en la laptop de presentación para una pregunta de prueba del chat — la respuesta será más lenta que Groq, confirmar que es tolerable (idealmente bajo 20 segundos) para no generar una mala experiencia si se activa el plan B.
- [ ] Si el tiempo de Ollama es demasiado alto (más de 25 segundos en esa laptop), evaluar un modelo más pequeño: `ollama pull llama3.2:3b` como alternativa más liviana.

**Verificación de bloque:** `ollama list` muestra el modelo descargado; una pregunta de prueba sobre ERP devuelve una respuesta coherente en tiempo tolerable.

---

## 3. Carga de datos semilla para la demo (plan A y plan B)

- [ ] Preparar un script de semilla (`scripts/seed_demo.py`) que cargue en la base de datos (tanto en la nube como en la local) los datos mínimos necesarios para una demo convincente sin depender de que el jurado suba archivos en vivo:
  - Al menos 4 temas predefinidos con contenido real cargado (chunks + embeddings generados).
  - Al menos 1 usuario de demo precreado (con correo y contraseña conocidos por el equipo) que ya tenga historial: 2-3 sesiones de chat previas y 1-2 evaluaciones completadas con puntajes variados.
- [ ] Ejecutar el script de semilla en la instancia de Supabase en la nube (plan A).
- [ ] Ejecutar el mismo script de semilla en la instancia local de Supabase (plan B), para que ambos entornos tengan los mismos datos de demo disponibles.
- [ ] Confirmar que el usuario de demo puede iniciar sesión, tiene historial visible en el perfil, y puede iniciar una conversación o evaluación inmediatamente — sin pasos previos en vivo frente al jurado.

**Verificación de bloque:** iniciar sesión con el usuario de demo y confirmar que el perfil muestra historial real (no vacío), que hay temas disponibles en el chat y en evaluaciones, y que la demo puede empezar sin pasos de configuración en vivo.

---

## 4. Prueba del cambio entre plan A y plan B

- [ ] Documentar los dos archivos `.env` necesarios:
  - `.env.plan-a`: apunta a Supabase nube + Groq como LLM.
  - `.env.plan-b`: apunta a Supabase local + Ollama como LLM.
- [ ] Practicar el cambio completo de plan A a plan B cronometrado: desde el momento en que se detecta que no hay internet hasta tener el sistema corriendo en local. El objetivo es que el cambio tome menos de 3 minutos:
  ```cmd
  copy .env.plan-b .env
  supabase start         (si no está corriendo)
  ollama serve           (si no está corriendo)
  uvicorn app.main:app --reload --port 8000
  ```
- [ ] Confirmar que el frontend en Next.js no requiere cambios de configuración para el plan B — debe funcionar igual apuntando al mismo `localhost:8000` del backend.
- [ ] Hacer la prueba con internet desconectado completamente: verificar que todo el flujo (login, chat, evaluación) funciona en plan B sin ninguna dependencia de red externa.

**Verificación de bloque:** cambio de plan A a plan B en menos de 3 minutos con internet desconectado; flujo completo de demo funciona en plan B sin errores.

---

## 5. Ensayo completo de la demo (plan A)

- [ ] Definir el guión de la demo: la secuencia exacta de pasos que se mostrarán al jurado, con tiempo estimado para cada parte. Sugerencia de estructura:
  1. Registro de un usuario nuevo en vivo (30 seg).
  2. Selección de un tema y conversación de 3 turnos sobre ERP (2-3 min).
  3. Generación y respuesta de una evaluación con los tres tipos de pregunta (3-4 min).
  4. Vista del perfil con historial y puntaje (1 min).
  5. (Opcional) Subida de un documento propio y conversación basada en él (2 min).
  Total estimado: 8-11 minutos.
- [ ] Hacer el ensayo completo al menos 2 veces con el sistema en plan A (nube + Groq), cronometrando cada sección.
- [ ] Identificar los momentos de espera más largos (generación de evaluación, procesamiento de documento) y decidir cómo manejarlos en vivo — por ejemplo, hablar sobre la arquitectura mientras se espera la respuesta del LLM, en vez de silencio incómodo.
- [ ] Confirmar que el texto de los mensajes de prueba usados en la demo es coherente con el marco teórico del trabajo de investigación (los mismos conceptos de ERP, gestión del cambio, capacitación que cubre la tesis), para que la demo refuerce el argumento de la investigación y no parezca desconectada del proyecto académico.

**Verificación de bloque:** ensayo completo ejecutado de principio a fin, sin errores, dentro del tiempo estimado, con el guión definido.

---

## 6. Ensayo completo de la demo (plan B)

- [ ] Repetir el ensayo completo del paso anterior pero con internet completamente desconectado (plan B activo: Supabase local + Ollama).
- [ ] Ajustar el guión si los tiempos de respuesta de Ollama requieren cambios en el ritmo de la presentación.
- [ ] Confirmar que todos los datos de demo están disponibles en la instancia local y la experiencia es equivalente al plan A (mismos temas, mismo historial del usuario de demo).

**Verificación de bloque:** ensayo completo en plan B funciona de principio a fin sin internet, con experiencia equivalente al plan A.

---

## 7. Checklist de arranque del día de la feria

- [ ] Crear un documento físico (papel o en el teléfono) con el checklist de arranque rápido para el día de la feria — no depender de que alguien lo recuerde de memoria bajo presión:

  **Plan A (con internet):**
  - [ ] Confirmar conexión a internet del local.
  - [ ] `cd backend && venv\Scripts\activate.bat && copy .env.plan-a .env && uvicorn app.main:app --port 8000`
  - [ ] `cd frontend && npm run dev` (o abrir el deploy de Vercel si está desplegado).
  - [ ] Abrir `http://localhost:3000` (o la URL de Vercel) y hacer login con el usuario de demo.
  - [ ] Confirmar que el chat responde y el perfil muestra historial.

  **Plan B (sin internet):**
  - [ ] `supabase start`
  - [ ] `ollama serve`
  - [ ] `cd backend && venv\Scripts\activate.bat && copy .env.plan-b .env && uvicorn app.main:app --port 8000`
  - [ ] `cd frontend && npm run dev`
  - [ ] Abrir `http://localhost:3000` y hacer login con el usuario de demo.
  - [ ] Confirmar que el chat responde desde Ollama.

- [ ] Tener la laptop cargada al 100% y con el cargador disponible.
- [ ] Tener el repositorio actualizado al último commit estable antes de llegar a la feria.
- [ ] No hacer commits ni cambios de código el día de la feria — solo el código que ya fue probado en el ensayo.

**Verificación de bloque:** el checklist está documentado, impreso o guardado en el teléfono, y todos los miembros del equipo lo conocen — no depende de una sola persona.

---

## 8. Cierre de la fase

- [ ] Confirmar que `.env.plan-a` y `.env.plan-b` existen localmente con las credenciales correctas y están excluidos del `.gitignore`.
- [ ] Confirmar que el script de semilla (`scripts/seed_demo.py`) está commiteado en el repositorio para poder reproducir los datos de demo si es necesario.
- [ ] Actualizar `docs/fases-proyecto.md` marcando la Fase 8 como completada.
- [ ] No hacer más cambios de funcionalidad después de esta fase — solo la Fase 9 (documentación final) queda pendiente.

**Condición de salida de la fase:** el equipo ha ensayado la demo completa al menos 2 veces (plan A y plan B), el cambio entre planes toma menos de 3 minutos, los datos de semilla están cargados en ambos entornos, el checklist de arranque del día de la feria está documentado y conocido por todos.
