# Plan de trabajo — Correcciones y mejoras
## Estado: post Fases 0-6

Basado en el estado real del proyecto observado en capturas del 01/07/2026.
Ejecutar en orden — cada bloque desbloquea al siguiente.

---

## Contexto del estado actual

- ✅ Backend conecta correctamente (problema de puerto 8001 resuelto)
- ✅ 5 temas predefinidos cargados y visibles en el frontend
- ✅ Landing page implementada
- ✅ Design system aplicado consistentemente en todas las pantallas
- ✅ `seed_temas.py` procesó el PDF real (`Grupo 3 Avance 4.pdf`) con Gemini Vision — no usó placeholders
- ❌ El bot rechaza todas las preguntas — **causa identificada:** el PDF se asoció únicamente al tema "Gestión del Cambio Organizacional"; los otros 4 temas no tienen chunks, y el fallback actual rechaza en vez de usar conocimiento general
- ❌ Evaluaciones no se generan (endpoint `POST /evaluaciones/generar` falla silenciosamente)
- ❌ Layout con espacio vacío excesivo en pantallas anchas (1440px+)
- ❌ Sin historial de chats visible ni acciones sobre sesiones (archivar, eliminar, papelera)
- ❌ Sin historial de evaluaciones visible ni pantalla de resultados con feedback

---

## Bloque 1 — Backend: comportamiento del bot (URGENTE)

> Desbloquea todo lo demás. Ejecutar primero.

### 1.1 — Cambiar la lógica de fallback del RAG

**Archivo:** `backend/app/chat/service.py`

- [ ] Cambiar el comportamiento cuando el retriever no encuentra contexto relevante: en vez de rechazar con un mensaje de "no encontré información", construir el prompt sin contexto adicional y dejar que el LLM responda desde su conocimiento general.
- [ ] Actualizar el system prompt a:
  > "Eres un asistente especializado en sistemas ERP. Responde usando el contexto provisto si está disponible. Si no hay contexto específico, usa tu conocimiento general sobre ERP para ayudar al usuario. Solo rechaza preguntas que no tengan ninguna relación con sistemas ERP, tecnología empresarial o temas laborales/organizacionales."
- [ ] Mantener el rechazo activo solo para preguntas completamente fuera de contexto (temas random sin relación alguna con tecnología o gestión empresarial).
- [ ] Probar con: "hola" (debe responder amablemente), "¿qué es un ERP?" (debe responder con conocimiento general), "¿cuál es la capital de Francia?" (debe rechazar amablemente).

**Verificación:** el bot mantiene conversaciones fluidas sobre ERP aunque la base de conocimiento esté vacía o incompleta.

---

### 1.2 — Diagnosticar y corregir la generación de evaluaciones

**Archivo:** `backend/app/evaluaciones/router.py`, `backend/app/evaluaciones/service.py`

- [ ] Agregar logging explícito en `POST /evaluaciones/generar` que registre: el `tema_id` recibido, el contexto recuperado por el retriever, la respuesta cruda del LLM antes del parseo, y el error si el parseo falla.
- [ ] Identificar la causa raíz del fallo (las tres más probables):
  - El LLM no devuelve JSON válido con la estructura esperada → ajustar el prompt para forzar JSON estricto.
  - El parseo falla con JSON parcialmente malformado → agregar reintento con prompt corregido.
  - El `tema_id` enviado desde el frontend no coincide con el formato esperado → validar y loguear el valor recibido.
- [ ] Corregir el fallo identificado.
- [ ] Confirmar que una evaluación de 8 preguntas se genera correctamente para al menos un tema.

**Verificación:** `POST /evaluaciones/generar` devuelve 8 preguntas con los tres tipos (opción múltiple, V/F, abierta) sin error.

---

### 1.3 — Distribuir el PDF entre los 5 temas

**Causa raíz confirmada:** el `seed_temas.py` asoció el PDF completo al tema "Gestión del Cambio Organizacional" (`tema_principal`). Los otros 4 temas existen en la tabla `tema` pero tienen cero chunks — el retriever no encuentra nada para ellos y rechaza.

**Archivos:** `scripts/seed_temas.py`, `backend/app/base_conocimiento/`

Hay dos estrategias para resolverlo, en orden de menor a mayor esfuerzo:

**Estrategia A — Reasociar el documento existente a todos los temas (rápida):**
- [ ] En Supabase, actualizar los chunks existentes del documento (ya procesados) para que cada tema tenga acceso a ellos. La forma más directa: en la tabla `chunk`, el campo `documento_id` apunta a un documento con un solo `tema_id`. Dado que el PDF cubre todos los temas, la opción más rápida es **quitar el filtro por `tema_id` en el retriever** cuando el documento es predefinido/oficial — así todos los temas usan el mismo corpus del PDF.
- [ ] Modificar la función de búsqueda vectorial (`retriever.py`) para que, cuando se busca en temas predefinidos, no filtre por `tema_id` sino que busque en todos los chunks de documentos con `es_predefinido = true` (o `visibilidad = 'compartido'` y `estado_moderacion = 'aprobado'`).

**Estrategia B — Crear un documento por tema (más correcto pero más costoso):**
- [ ] Modificar el `seed_temas.py` para procesar el PDF una vez y crear 5 registros en `documento`, uno por tema, compartiendo los mismos chunks o re-procesando secciones relevantes del PDF para cada tema.
- [ ] Para los temas que el PDF no cubre suficientemente (especialmente Ética Profesional en TI e Implementación de ERP), crear archivos `.md` con contenido curado (Claude Code puede generarlos) y procesarlos como documentos adicionales por tema.

**Recomendación:** implementar **Estrategia A primero** (cambio en el retriever, sin re-procesar el PDF) para desbloquear el funcionamiento inmediato. Implementar **Estrategia B** después si el tiempo lo permite, para mejorar la precisión de las respuestas por tema.

**Verificación:** preguntar sobre cada uno de los 5 temas y confirmar que el bot responde con contenido relevante en todos, no solo en "Gestión del Cambio Organizacional".

---

## Bloque 2 — Frontend: layout y espacios vacíos

> Ejecutar después del Bloque 1.1 para poder ver los cambios con el bot funcionando.

### 2.1 — Pantalla de selección de temas del chat (`/chat`)

- [ ] Rediseñar el layout a dos columnas reales:
  - **Columna izquierda (60%):** grid de temas en 2 o 3 columnas, con las cards actuales.
  - **Columna derecha (40%):** panel de "Conversaciones recientes" — lista de sesiones previas con nombre del tema, fecha y snippet del último mensaje.
- [ ] Cada sesión en el panel derecho debe ser clickeable y llevar al historial de esa sesión.
- [ ] Si no hay conversaciones previas, mostrar el estado vacío correspondiente.

### 2.2 — Pantalla de chat activo (`/chat/[sesionId]`)

- [ ] Expandir el área de mensajes al ancho completo disponible — quitar el margen excesivo que centra los mensajes en una franja angosta.
- [ ] Confirmar que el input de mensaje está anclado al fondo y el área de mensajes hace scroll correctamente.

### 2.3 — Historial de chats: archivar, eliminar y papelera

**Requiere cambio en base de datos antes de implementar el frontend:**

```sql
-- Ejecutar en Supabase SQL Editor antes de que Claude Code implemente el frontend
alter table public.sesion_chat
  add column if not exists archivada boolean not null default false,
  add column if not exists eliminada_en timestamptz;
```

- [ ] Ejecutar el SQL anterior en Supabase.
- [ ] Cada sesión en el historial debe tener tres acciones: **Archivar** (oculta del historial principal, permanece accesible), **Eliminar** (mueve a papelera, registra `eliminada_en`), **Ver** (abre el historial de la sesión en modo lectura).
- [ ] Agregar sección "Archivadas" (colapsable) y sección "Papelera" accesibles desde el panel de historial.
- [ ] Las sesiones en papelera se eliminan definitivamente después de 30 días (filtro por `eliminada_en < now() - interval '30 days'`; la eliminación real puede ser manual por ahora o via una función de Supabase).
- [ ] Actualizar los endpoints del backend para soportar filtros: `archivada=false` y `eliminada_en is null` en el listado por defecto.

### 2.4 — Pantalla de evaluaciones (`/evaluaciones`)

- [ ] Rediseñar el layout a dos columnas:
  - **Columna izquierda (55%):** selección de tema para generar evaluación (grid de temas con cards).
  - **Columna derecha (45%):** panel de historial de intentos — cada item muestra tema, fecha, puntaje (escala 0-20) y badge aprobado/desaprobado.
- [ ] Si no hay intentos previos, mostrar el estado vacío correspondiente.

### 2.5 — Centrado general en pantallas anchas

- [ ] Revisar todos los contenedores de contenido en todas las rutas protegidas y asegurar que usen `max-w-6xl` o `max-w-7xl` con `mx-auto` para escalar correctamente en pantallas de 1440px+.
- [ ] Verificar visualmente en 1280px, 1440px y 1920px de ancho.

---

## Bloque 3 — Evaluaciones: historial y feedback

### 3.1 — Historial de intentos en `/evaluaciones`

- [ ] Conectar `GET /evaluaciones/historial` con el panel derecho de la pantalla de evaluaciones.
- [ ] Cada item del historial debe mostrar: nombre del tema, fecha, puntaje (ej. "16/20"), badge de aprobado (verde `--accent`) o desaprobado (rojo `--danger`) según umbral de 11/20.
- [ ] Click en un item lleva a la pantalla de resultados de ese intento.

### 3.2 — Pantalla de resultados de evaluación

**Ruta:** `/evaluaciones/[intentoId]/resultados`

- [ ] Verificar si la ruta existe; si no, crearla.
- [ ] La pantalla debe mostrar:
  - Puntaje total en grande (escala 0-20), con indicador visual aprobado/desaprobado.
  - Por cada pregunta: enunciado, respuesta dada por el usuario, indicador correcto/incorrecto (ícono check/x en `--accent`/`--danger`), respuesta correcta si era incorrecta, y feedback del LLM para preguntas abiertas.
- [ ] Aplicar el design system: sin íconos coloridos, check/x minimalistas, paleta oscura.
- [ ] Botón "Nueva evaluación" al final para volver a `/evaluaciones`.

### 3.3 — Puntaje por pregunta visible durante la evaluación

- [ ] Mostrar el peso/puntaje de cada pregunta durante la evaluación: opción múltiple y V/F valen 1 punto, preguntas abiertas valen 1 punto pero con calificación parcial (0.0–1.0 mapeado a 0-1 punto).
- [ ] Mostrar el total de puntos posibles en el encabezado de la evaluación (ej. "Evaluación · 8 preguntas · 8 puntos posibles").

---

## Orden de ejecución para Claude Code

```
Bloque 1.1  →  Bloque 2.1-2.5  →  Bloque 1.2  →  Bloque 3.1-3.3  →  Bloque 1.3 + Bloque 4
   (bot)         (layout)          (eval fix)       (historial)       (conocimiento)
```

> El Bloque 1.3 es el más costoso en tiempo. Priorizar todo lo demás primero para tener la app funcional y visualmente correcta antes de invertir tiempo en el contenido.

---

## SQL adicional requerido antes de implementar

Ejecutar en Supabase SQL Editor **antes** de que Claude Code implemente el Bloque 2.3:

```sql
-- Soporte para archivar y papelera en sesiones de chat
alter table public.sesion_chat
  add column if not exists archivada boolean not null default false,
  add column if not exists eliminada_en timestamptz;

-- Índice para filtrar sesiones activas (no archivadas, no eliminadas)
create index if not exists idx_sesion_chat_activa
  on public.sesion_chat(usuario_id, archivada, eliminada_en)
  where archivada = false and eliminada_en is null;
```

---

## Decisiones confirmadas

- ✅ `seed_temas.py` usó contenido real (PDF procesado con Gemini Vision, no placeholders)
- ✅ Estrategia para base de conocimiento: Estrategia A primero (modificar retriever para no filtrar por tema_id en documentos predefinidos), luego Estrategia B si el tiempo lo permite
- ✅ Nombre del proyecto: **ChatERP** (definitivo)
