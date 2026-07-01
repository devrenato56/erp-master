# Fase 7 — Endurecimiento (RNF) y pulido de UI

Desglose de tareas para cerrar los requerimientos no funcionales priorizados y aplicar el design system de forma consistente en toda la app. Esta fase no agrega funcionalidades nuevas — su objetivo es que todo lo construido en las Fases 2-6 sea robusto, rápido, seguro y visualmente coherente antes del ensayo de feria.

Depende de que las Fases 2 a 6 estén completas. Cubre los RNF priorizados: RNF-01 al RNF-19.

---

## 1. Rendimiento (RNF-01, RNF-02, RNF-03)

- [ ] Medir el tiempo de respuesta del chat (RAG) con Groq activo en condiciones reales: hacer al menos 10 preguntas de prueba sobre distintos temas y registrar los tiempos. El objetivo es que el percentil 90 esté bajo los 8 segundos (RNF-01).
- [ ] Si el tiempo supera el límite, identificar el cuello de botella: ¿es la generación de embeddings de la query? ¿La búsqueda en pgvector? ¿La llamada al LLM? Optimizar el componente más lento.
- [ ] Medir el tiempo de generación de evaluación (5-10 preguntas) y confirmar que se mantiene bajo los 15 segundos (RNF-02). Si supera el límite, reducir el número de preguntas por defecto o simplificar el prompt.
- [ ] Medir el tiempo de procesamiento de un PDF de 20 páginas (extracción Gemini + chunking + embeddings) y confirmar que no excede los 30 segundos (RNF-03). Si supera el límite, evaluar procesar páginas en paralelo con `asyncio` o reducir la resolución de rasterización.
- [ ] Confirmar que el modelo `all-MiniLM-L6-v2` está cargado una sola vez al iniciar el backend (singleton), no en cada request — error frecuente que puede multiplicar el tiempo de respuesta por 3-5x.
- [ ] Agregar caché básico para embeddings de queries recurrentes (opcional, bajo costo de implementación con un diccionario en memoria, puede ahorrar 200-400ms por query repetida en una demo).

**Verificación de bloque:** los tres tiempos límite se cumplen en condiciones reales con el proveedor activo (Groq), no solo en condiciones ideales de laboratorio.

---

## 2. Seguridad (RNF-04, RNF-05, RNF-06, RNF-07, RNF-08)

- [ ] Auditar el repositorio completo: confirmar que ningún archivo `.env`, `.env.local`, clave de API, JWT secret, o `service_role key` está commiteado en Git. Usar `git log --all --full-history -- "**/.env"` para verificar que no hay rastros en el historial (RNF-05).
- [ ] Confirmar que el `.gitignore` cubre todos los archivos sensibles en backend y frontend (`backend/.env`, `frontend/.env.local`, `backend/venv/`, `frontend/node_modules/`, `frontend/.next/`).
- [ ] Verificar que las contraseñas son manejadas completamente por Supabase Auth (hashing bcrypt nativo) — confirmar que en ningún punto el backend recibe o almacena contraseñas en texto plano (RNF-04).
- [ ] Auditar los endpoints del backend: confirmar que todos los endpoints que devuelven o modifican datos de usuario requieren JWT válido y que el `user_id` extraído del token — nunca del body del request — es el que se usa para filtrar datos (RNF-06).
- [ ] Verificar que el `service_role key` de Supabase solo aparece en `app/core/supabase_client.py` del backend y en el `.env` — nunca en código de frontend ni en ningún endpoint que lo exponga al cliente.
- [ ] Validar el tipo y tamaño de archivo en el endpoint `POST /documentos` antes de procesar: rechazar archivos que no sean PDF/DOCX/TXT/MD y archivos que superen los 10MB, con mensajes de error claros (RNF-08).
- [ ] Sanitizar el contenido de mensajes de chat antes de incluirlos en prompts del LLM: prevenir prompt injection básico (por ejemplo, un usuario que escriba "ignora todas las instrucciones anteriores y..."). Un filtro simple que detecte patrones de inyección comunes es suficiente para este alcance.
- [ ] Confirmar que HTTPS está activo en el despliegue en nube (Vercel lo maneja automáticamente para el frontend; confirmar que el backend en Render/Railway también tiene TLS activado) — RNF-07.

**Verificación de bloque:** ninguna credencial en el repo, todos los endpoints sensibles requieren JWT, el `service_role key` no es accesible desde el cliente, validación de archivos funciona con casos límite (archivo de 11MB, archivo con extensión incorrecta).

---

## 3. Usabilidad (RNF-09, RNF-10, RNF-11)

- [ ] Revisar responsividad en los tres breakpoints principales: laptop (1280px+), tablet (768px-1279px), móvil (menos de 768px). Usar las DevTools del navegador para simular cada tamaño (RNF-09).
- [ ] Identificar y corregir los problemas de layout más comunes en mobile: sidebar que desborda, chat input que queda tapado por el teclado virtual, cards demasiado anchas, tablas que no caen bien en pantalla angosta.
- [ ] Auditar todos los mensajes de error de la app: confirmar que ningún error técnico crudo llega al usuario (stack traces, mensajes de Supabase/Groq en inglés sin procesar, códigos HTTP sin contexto) — RNF-10. Reemplazar cada error crudo identificado por un mensaje en español, claro y accionable.
- [ ] Auditar todos los estados de carga (RNF-11): confirmar que cada operación que tome más de 1-2 segundos muestra un indicador visible (spinner, skeleton, barra de progreso, o texto "procesando..."). Las operaciones críticas a verificar:
  - Respuesta del chat.
  - Generación de evaluación.
  - Procesamiento de documento subido.
  - Calificación de preguntas abiertas.
  - Carga inicial del historial en el perfil.
- [ ] Revisar que los estados de carga desaparecen correctamente cuando la operación termina — un spinner que se queda pegado es peor que no tener spinner.

**Verificación de bloque:** la app es usable en tablet (el jurado puede explorarla desde un dispositivo diferente a la laptop donde corre el backend); ningún error técnico crudo llega al usuario; todas las operaciones lentas tienen indicadores de carga que aparecen y desaparecen correctamente.

---

## 4. Disponibilidad y confiabilidad (RNF-12, RNF-13, RNF-14)

- [ ] Probar el comportamiento cuando Groq está caído o sin internet (desconectar internet con LLM_PROVIDER=groq activo): confirmar que el sistema reintenta máximo 2 veces, devuelve un mensaje amigable al usuario, y no rompe la sesión ni pierde el historial ya guardado (RNF-13).
- [ ] Probar el comportamiento cuando Supabase no está disponible brevemente: confirmar que los errores de base de datos son capturados y devueltos como mensajes amigables, no como crashes del servidor.
- [ ] Confirmar que reiniciar el backend (Ctrl+C + uvicorn de nuevo) no pierde ningún dato de usuario — todo debe estar persistido en Supabase, no en memoria del servidor (RNF-14).
- [ ] Configurar el backend en Render/Railway con reinicio automático ante caídas (la mayoría de plataformas lo tienen activo por defecto, pero confirmar que está habilitado) — RNF-12.
- [ ] Preparar un checklist de arranque rápido para el día de la feria: pasos exactos para levantar el sistema desde cero en menos de 5 minutos (frontend, backend, confirmar conexión a Supabase y Groq).

**Verificación de bloque:** simular los tres fallos (LLM caído, Supabase caído brevemente, backend reiniciado) y confirmar que en ningún caso el usuario pierde datos ni ve un error técnico crudo.

---

## 5. Escalabilidad y mantenibilidad (RNF-15, RNF-16)

- [ ] Revisar que la separación modular del backend está siendo respetada: que el módulo `chat` no importa directamente funciones del módulo `evaluaciones` ni de `base_conocimiento` sin pasar por interfaces claras (RNF-15).
- [ ] Confirmar que el índice HNSW sobre `chunk.embedding` está activo y siendo usado por las consultas de similitud — revisar con `EXPLAIN ANALYZE` en el SQL Editor de Supabase que la consulta de búsqueda vectorial no hace un full scan (RNF-16).
- [ ] Si el número de chunks en la base de datos crece durante las pruebas (por documentos subidos), confirmar que los tiempos de búsqueda no se degradan significativamente.

**Verificación de bloque:** `EXPLAIN ANALYZE` de la consulta vectorial muestra uso del índice HNSW, no un seq scan.

---

## 6. Costos y logging (RNF-17, RNF-18)

- [ ] Confirmar que el historial de chat incluido en cada prompt del LLM está limitado a los últimos N turnos (definido en Fase 4) — revisar que este límite se está aplicando correctamente y no crece sin control en conversaciones largas (RNF-17).
- [ ] Confirmar que el contexto recuperado por el retriever está limitado a un máximo de tokens razonable por request (RNF-17).
- [ ] Revisar los logs del backend: confirmar que cada llamada al LLM registra al menos: timestamp, proveedor, modelo, tiempo de respuesta, y si hubo error (RNF-18).
- [ ] Estimar el consumo de tokens en un escenario de uso de feria (por ejemplo, 20 usuarios, 5 mensajes de chat cada uno + 1 evaluación) y confirmar que está dentro de los límites del tier gratuito de Groq.

**Verificación de bloque:** los logs muestran información suficiente para diagnosticar problemas sin revisar código; la estimación de consumo confirma que el tier gratuito de Groq aguanta el volumen esperado en la feria.

---

## 7. Compatibilidad (RNF-19)

- [ ] Probar la app en Chrome, Edge y Firefox (últimas versiones) en la laptop de desarrollo.
- [ ] Verificar que no hay funcionalidades que dependan de APIs de navegador no soportadas en alguno de los tres.
- [ ] Verificar que las fuentes (Inter) cargan correctamente en los tres navegadores.
- [ ] Confirmar que el chat, la evaluación y el perfil funcionan end-to-end en los tres navegadores sin diferencias visuales significativas.

**Verificación de bloque:** demo completa funciona en Chrome, Edge y Firefox sin errores ni diferencias visuales graves.

---

## 8. Pulido visual final (design system)

- [ ] Recorrer toda la app pantalla por pantalla con `docs/design-system.md` abierto y verificar:
  - Paleta: ningún color fuera de los tokens definidos (`--bg-base`, `--bg-surface`, `--accent`, etc.).
  - Tipografía: Inter en todos los textos, tamaños dentro del sistema definido.
  - Radios: ningún componente con radius mayor a 8px.
  - Bordes: separación de regiones con `1px solid var(--border)`, sin `box-shadow` decorativos en cards en reposo.
  - Espaciado: consistente con el sistema de 4px base.
- [ ] Identificar y corregir las 3-5 inconsistencias visuales más notorias que hayan quedado de las fases anteriores (es normal que en el calor del desarrollo algún componente haya quedado con un estilo ligeramente distinto).
- [ ] Revisar específicamente los estados de hover e interacción: que los colores de hover (`--bg-surface-hover`), focus de inputs (`--border-strong`) y estados activos de navegación estén aplicados de forma consistente.
- [ ] Revisar la tipografía en mobile — los tamaños definidos para desktop pueden quedar demasiado grandes o pequeños en pantallas angostas.

**Verificación de bloque:** recorrer la app completa sin encontrar ningún componente que rompa visiblemente las reglas del design system — la app debe verse como un producto cohesivo, no como una colección de pantallas hechas por personas distintas.

---

## 9. Cierre de la fase

- [ ] Documentar brevemente cualquier RNF que se haya decidido no implementar completamente (y por qué), para poder responder al jurado si pregunta.
- [ ] Actualizar `docs/fases-proyecto.md` marcando la Fase 7 como completada.
- [ ] Commit y push final de la fase con un mensaje descriptivo del estado del proyecto.

**Condición de salida de la fase:** todos los RNF priorizados (rendimiento, seguridad, usabilidad, confiabilidad) están verificados en condiciones reales; la app se ve visualmente coherente de extremo a extremo; ningún error técnico crudo llega al usuario ante los fallos más comunes (LLM caído, archivo inválido, sesión expirada).
