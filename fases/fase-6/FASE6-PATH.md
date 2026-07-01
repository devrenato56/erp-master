# Fase 6 — Perfil y seguimiento de progreso

Desglose de tareas para implementar el módulo de perfil de usuario: resumen de actividad, historial de conversaciones, historial de evaluaciones, y gestión de documentos propios desde un único lugar. Esta fase consolida la experiencia del usuario y conecta todos los módulos anteriores en una vista unificada.

Depende de que las Fases 2 a 5 estén completas — el perfil no genera datos propios, los consume de todas las tablas ya pobladas. Cubre RF-22 y RF-23.

---

## 1. Endpoints de perfil y progreso

- [ ] `GET /perfil`: devuelve los datos del usuario autenticado (`nombre`, `correo`, `rol`, `creado_en`) consultando la tabla `public.usuario`.
- [ ] `PATCH /perfil`: permite al usuario actualizar su `nombre` — único campo editable desde el perfil (no correo ni rol). Validar que el campo no esté vacío.
- [ ] `GET /perfil/progreso`: devuelve un resumen de actividad del usuario (RF-22):
  - Total de temas estudiados (temas que tienen al menos una `sesion_chat` del usuario).
  - Total de evaluaciones realizadas (count de `intento_evaluacion` con `completado_en` no nulo).
  - Puntaje promedio de evaluaciones (promedio de `puntaje_total` en escala 0-20).
  - Mejor puntaje obtenido y en qué tema.
  - Última sesión de chat (fecha y tema).
  - Última evaluación completada (fecha, tema y puntaje).
- [ ] `GET /perfil/sesiones`: lista el historial de sesiones de chat del usuario, ordenado por `iniciada_en` descendente, con el nombre del tema asociado (RF-15).
- [ ] `GET /perfil/evaluaciones`: lista el historial de intentos de evaluación del usuario, ordenado por `completado_en` descendente, con nombre del tema y puntaje (RF-21).
- [ ] `GET /perfil/documentos`: lista los documentos propios del usuario con nombre, formato, visibilidad, estado de moderación y fecha de subida (RF-23).
- [ ] `DELETE /perfil/documentos/{id}`: elimina un documento propio del usuario — validar que el documento pertenece al usuario autenticado antes de eliminar. La eliminación debe borrar en cascada los `chunk` asociados (ya cubierto por FK) y el archivo en Supabase Storage.

**Verificación de bloque:** todos los endpoints responden con datos reales generados en fases anteriores (sesiones de chat, intentos de evaluación, documentos subidos). Confirmar que ningún endpoint devuelve datos de otros usuarios.

---

## 2. Frontend: pantalla de perfil

- [ ] Ruta `/perfil`: pantalla principal del perfil del usuario con las siguientes secciones, aplicando el design system (`docs/design-system.md`).
- [ ] **Sección: datos del usuario** — mostrar nombre, correo (no editable desde UI por ahora) y fecha de registro. Botón de editar nombre inline (sin abrir un modal separado si es posible — edición directa en el campo es más limpia visualmente).
- [ ] **Sección: resumen de progreso** (RF-22) — cards de estadísticas con los datos de `GET /perfil/progreso`: temas estudiados, evaluaciones realizadas, puntaje promedio. Usar el patrón de cards de estadísticas del design system (número grande + label pequeño, borde fino, sin sombra).
- [ ] **Sección: historial de conversaciones** — lista de sesiones pasadas con nombre del tema y fecha, ordenadas de más reciente a más antigua. Cada item es clickeable y lleva al historial de esa sesión (puede abrir la vista de chat en modo lectura, sin input de nuevo mensaje).
- [ ] **Sección: historial de evaluaciones** — lista de intentos completados con tema, fecha, puntaje en escala 0-20, e indicador visual de aprobado/desaprobado. Cada item es clickeable y lleva a la pantalla de resultados de ese intento.
- [ ] **Sección: mis documentos** (RF-23) — lista de documentos propios con nombre, formato (badge), visibilidad (privado/compartido) y estado de moderación (pendiente/aprobado/rechazado en los colores del design system). Botón de eliminar por documento, con confirmación antes de borrar.
- [ ] Botón de cerrar sesión visible en el perfil (o en el navbar si aplica).

**Verificación de bloque:** la pantalla de perfil muestra datos reales y actualizados de todas las secciones; el historial de conversaciones y evaluaciones es navegable; eliminar un documento lo quita de la lista sin recargar la página completa.

---

## 3. Navegación global (navbar / sidebar)

- [ ] Definir la navegación global de la app (navbar superior o sidebar lateral — decidir cuál es más coherente con las referencias visuales del design system, siendo sidebar la opción más consistente con hackO y Workly).
- [ ] Items de navegación mínimos: Inicio / Chat / Evaluaciones / Perfil.
- [ ] Indicar visualmente el item activo (fondo sutil `--bg-surface-hover` + borde izquierdo en `--accent`, como en las referencias).
- [ ] La navegación debe estar presente en todas las rutas protegidas (chat, evaluaciones, perfil) — no en login/registro.
- [ ] Mostrar el nombre del usuario autenticado en la parte inferior del sidebar o en el navbar, junto a la opción de cerrar sesión.

**Verificación de bloque:** la navegación es consistente en todas las pantallas protegidas; el item activo se resalta correctamente; el nombre del usuario se muestra sin necesidad de recargar.

---

## 4. Estados vacíos

- [ ] Diseñar e implementar estados vacíos para cada sección del perfil cuando el usuario no tiene datos aún (RF-22 conecta con esto — un usuario nuevo no tiene historial):
  - Sin sesiones de chat: texto breve + botón "Ir al chat".
  - Sin evaluaciones: texto breve + botón "Hacer una evaluación".
  - Sin documentos: texto breve + botón "Subir un documento".
- [ ] Los estados vacíos deben ser minimalistas: texto en `--text-muted`, sin ilustraciones decorativas, con un CTA claro en color `--accent` que lleve a la sección correspondiente. Referencia visual: el estado vacío de Vercel en la imagen 5 de las referencias del design system.

**Verificación de bloque:** un usuario recién registrado que no ha hecho nada ve estados vacíos en cada sección, no pantallas en blanco o errores.

---

## 5. Cierre de la fase

- [ ] Confirmar que `GET /perfil/progreso` y todos los endpoints de historial respetan RLS — no pueden devolver datos de otros usuarios bajo ninguna circunstancia.
- [ ] Confirmar que eliminar un documento desde el perfil borra correctamente tanto el registro en la tabla `documento` (con cascada a `chunk`) como el archivo en Supabase Storage.
- [ ] Revisar que la navegación global es coherente y no rompe el layout en ninguna de las rutas.
- [ ] Revisar la consistencia visual del perfil contra `docs/design-system.md` — paleta, tipografía, radios, bordes.
- [ ] Actualizar `docs/fases-proyecto.md` marcando la Fase 6 como completada.
- [ ] Commit y push de todo lo desarrollado en esta fase, separado por bloque.

**Condición de salida de la fase:** un usuario puede ver en una sola pantalla su resumen de actividad (temas estudiados, evaluaciones y puntaje promedio), navegar su historial de conversaciones y evaluaciones, y gestionar sus documentos propios — todo con el design system aplicado, estados vacíos correctos para usuarios sin historial, y navegación global consistente en toda la app.
