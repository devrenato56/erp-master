# Fase 5 — Evaluaciones

Desglose de tareas para implementar el módulo completo de evaluaciones: generación automática de preguntas por tema, corrección automática (opción múltiple y V/F), calificación con feedback vía LLM (preguntas abiertas), cálculo de puntaje consolidado, y persistencia de intentos por usuario.

Esta fase depende de que la Fase 4 esté completa — el mismo pipeline de recuperación de contexto (retriever) se reutiliza aquí para basar las preguntas en el contenido real de la base de conocimiento, no en el conocimiento general del LLM. Cubre RF-16 a RF-21.

---

## 1. Generación de preguntas

- [ ] Escribir `app/evaluaciones/service.py`: función `generar_evaluacion(tema_id, n_preguntas=8)` que:
  - Recupere chunks representativos del tema usando el retriever (misma función de Fase 4, con una query genérica tipo "conceptos clave de este tema" o recuperando chunks aleatorios distribuidos para cubrir distintas partes del contenido).
  - Construya un prompt que instruya al LLM a generar preguntas basadas únicamente en ese contexto recuperado — nunca inventar preguntas sobre contenido no presente en los chunks.
  - Solicite al LLM una respuesta estructurada en JSON con el esquema exacto que necesita la tabla `pregunta` (tipo, enunciado, opciones, respuesta correcta).
  - Parsee y valide la respuesta JSON antes de persistir — manejar el caso de JSON malformado con reintento limitado.
- [ ] Soportar los tres tipos de pregunta en el prompt: opción múltiple (4 opciones, una correcta), verdadero/falso (dos opciones), y abierta (sin opciones, sin respuesta correcta definida).
- [ ] Distribuir los tipos de pregunta de forma razonable por defecto (por ejemplo: 40% opción múltiple, 30% V/F, 30% abiertas) — configurable si se quiere ajustar después.
- [ ] Persistir la `evaluacion` generada (con su `tema_id` y `titulo`) y todas sus `pregunta` en Supabase usando el `service_role key` del backend.
- [ ] Evitar generar evaluaciones duplicadas para el mismo tema si ya existe una reciente (opcional, pero evita acumular evaluaciones idénticas en la tabla).

**Verificación de bloque:** generar una evaluación de prueba para un tema predefinido y confirmar que: el JSON devuelto por el LLM es parseable, los tres tipos de pregunta están presentes, y las preguntas tienen coherencia con el contenido real del tema.

---

## 2. Corrección automática (opción múltiple y V/F)

- [ ] Función `corregir_automatica(pregunta, respuesta_dada)`: compara la respuesta del usuario con `pregunta.respuesta_correcta` de forma normalizada (ignorar mayúsculas, espacios extra, variaciones menores).
- [ ] Devolver `puntaje_obtenido`: 1.0 si es correcta, 0.0 si es incorrecta (para opción múltiple y V/F no hay medios puntos).
- [ ] No llamar al LLM para estos tipos — la corrección es determinista y local, sin costo de API (RNF-17).

**Verificación de bloque:** una respuesta correcta devuelve 1.0, una incorrecta devuelve 0.0, y variaciones de capitalización/espacios no rompen la comparación.

---

## 3. Calificación con feedback vía LLM (preguntas abiertas)

- [ ] Función `calificar_abierta(pregunta, respuesta_dada, contexto_tema)`: construye un prompt que instruya al LLM a:
  - Evaluar la respuesta del usuario comparándola con el contexto del tema (los mismos chunks usados para generar la pregunta).
  - Devolver una calificación numérica entre 0.0 y 1.0 (donde 1.0 es respuesta completa y correcta).
  - Devolver feedback cualitativo explicando los aciertos y los errores específicos de esa respuesta (RF-19).
  - Responder en JSON con el esquema `{"puntaje": float, "feedback": "string"}`.
- [ ] Parsear y validar la respuesta JSON; si el LLM devuelve algo malformado, reintentar una vez antes de asignar puntaje 0 con feedback genérico de error.
- [ ] El feedback debe ser constructivo y específico al contenido de la respuesta — no genérico ("buena respuesta", "incorrecto") — instrucción explícita en el prompt.
- [ ] Incluir el contexto del tema en el prompt de calificación para que el LLM juzgue contra el material real, no contra su conocimiento general.

**Verificación de bloque:** tres casos de prueba — respuesta correcta y completa (puntaje alto + feedback positivo), respuesta parcial (puntaje medio + feedback indicando qué falta), respuesta incorrecta o en blanco (puntaje bajo + feedback explicativo). Confirmar que el feedback es específico y no genérico.

---

## 4. Cálculo de puntaje consolidado

- [ ] Función `calcular_puntaje_total(respuestas)`: promedia los `puntaje_obtenido` de todas las respuestas del intento, ponderando igual todos los tipos de pregunta.
- [ ] Convertir el promedio a escala de 0 a 20 (estándar académico en Perú, relevante dado el contexto universitario del proyecto) además del 0.0–1.0 interno — mostrar ambas representaciones o solo la de 0-20 según lo que prefieran presentar en la feria.
- [ ] Persistir el `puntaje_total` en `intento_evaluacion.puntaje_total` una vez que todas las respuestas están calificadas.

**Verificación de bloque:** un intento con respuestas mixtas (correctas, parciales, incorrectas) calcula un puntaje total coherente y consistente.

---

## 5. Endpoints de evaluaciones

- [ ] `POST /evaluaciones/generar`: recibe `tema_id` y genera + persiste una nueva evaluación, devolviendo el `evaluacion_id` y las preguntas (sin `respuesta_correcta` en la respuesta al cliente — no se expone la clave correcta antes de que el usuario responda).
- [ ] `POST /evaluaciones/{evaluacion_id}/intentos`: crea un nuevo `intento_evaluacion` para el usuario autenticado, devuelve el `intento_id`.
- [ ] `POST /evaluaciones/intentos/{intento_id}/respuestas`: recibe la lista de respuestas del usuario para todas las preguntas del intento, ejecuta la corrección (automática o LLM según tipo), persiste cada `respuesta_usuario` con su `puntaje_obtenido` y `feedback_llm`, calcula el puntaje total, actualiza `intento_evaluacion.puntaje_total` y `completado_en`.
- [ ] `GET /evaluaciones/intentos/{intento_id}`: devuelve el resultado completo del intento (preguntas, respuestas dadas, puntaje por pregunta, feedback, puntaje total).
- [ ] `GET /evaluaciones/historial`: lista todos los intentos del usuario autenticado con su puntaje y fecha (RF-21).
- [ ] Validar en todos los endpoints que el usuario solo puede acceder a sus propios intentos (RNF-06).

**Verificación de bloque:** flujo completo vía API — generar evaluación → crear intento → enviar respuestas → ver resultado con puntajes y feedback → consultar historial. Probar con los tres tipos de pregunta en un mismo intento.

---

## 6. Frontend: flujo de evaluación

- [ ] Pantalla de inicio de evaluación (`/evaluaciones`): selector de tema, botón "Generar evaluación", indicador de carga mientras el LLM genera las preguntas (puede tardar hasta 15 segundos — RNF-02).
- [ ] Pantalla de evaluación en curso (`/evaluaciones/[intentoId]`):
  - Mostrar todas las preguntas en pantalla con scroll (para que el jurado pueda ver el conjunto completo en la demo).
  - Opción múltiple: radio buttons con las 4 opciones.
  - Verdadero/Falso: dos botones o toggle.
  - Preguntas abiertas: textarea.
  - Botón "Enviar evaluación" al final, con confirmación antes de enviar.
  - Indicador de carga mientras se califica (especialmente para las preguntas abiertas que llaman al LLM).
- [ ] Pantalla de resultados (`/evaluaciones/[intentoId]/resultados`):
  - Puntaje total destacado en escala 0-20, con indicador visual de aprobado/desaprobado (umbral sugerido: 11/20).
  - Por cada pregunta: la respuesta dada, ícono check/x en `--accent`/`--danger` (minimalistas, sin colores extra), y feedback del LLM para preguntas abiertas.
  - Aplicar el design system completo: radios bajos, bordes finos, paleta oscura, tipografía Inter.
- [ ] Historial de evaluaciones accesible desde el perfil: lista de intentos con tema, fecha y puntaje.

**Verificación de bloque:** flujo completo en la UI de extremo a extremo — seleccionar tema → generar evaluación → responder todas las preguntas → ver resultados con feedback → puntaje guardado en historial.

---

## 7. Cierre de la fase

- [ ] Confirmar que `respuesta_correcta` de las preguntas nunca se expone al frontend antes de que el intento esté completado.
- [ ] Confirmar que las políticas RLS de `intento_evaluacion` y `respuesta_usuario` están funcionando (un usuario no puede ver intentos ajenos).
- [ ] Validar el tiempo de generación de evaluación contra RNF-02 (máximo 15 segundos para 5-10 preguntas).
- [ ] Validar que el feedback de preguntas abiertas es específico y útil — ajustar el prompt si es necesario antes de la feria.
- [ ] Actualizar `docs/fases-proyecto.md` marcando la Fase 5 como completada.
- [ ] Commit y push de todo lo desarrollado en esta fase, separado por bloque.

**Condición de salida de la fase:** un usuario puede generar una evaluación sobre un tema, responderla completa (con los tres tipos de pregunta), ver su puntaje en escala 0-20 con feedback específico por pregunta, y consultar ese resultado desde su historial — todo funcionando en la UI con el design system aplicado.
