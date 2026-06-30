# Requerimientos del sistema — ChatERP

## Descripción

Se creará un sistema RAG (generative AI) especializado en sistemas ERP generales con el objetivo de que el sistema pueda capacitar correctamente a un empleado sobre el uso de sistemas ERP de manera conversacional. Se le permitirá la generación de evaluaciones para conocer cuánto ha aprendido el usuario. Asimismo, se contará con módulos de aprendizaje donde el bot actuará como tutor de todo lo general según el material y tema que se seleccione.

## Arquitectura

Monolito modular, para facilitar el deploy del proyecto.

---

## Requerimientos funcionales (RF)

### Módulo 1: Autenticación y usuarios

- **RF-01**: El sistema debe permitir el registro de nuevos usuarios (nombre, correo, contraseña).
- **RF-02**: El sistema debe permitir el inicio de sesión con credenciales válidas.
- **RF-03**: El sistema debe mantener una sesión activa del usuario mediante token (JWT u otro mecanismo).
- **RF-04**: El sistema debe asociar todo historial de chat, evaluaciones y documentos subidos al usuario autenticado.

### Módulo 2: Gestión de contenido / base de conocimiento

- **RF-05**: El sistema debe contar con una base de conocimiento predefinida sobre temas ERP generales (módulos, buenas prácticas, terminología, capacitación, ética, gestión del cambio).
- **RF-06**: El sistema debe permitir al usuario subir documentos propios en formato PDF, Word (.docx) y texto plano/markdown.
- **RF-07**: Al subir un documento, el sistema debe permitir al usuario marcarlo como **privado** (solo visible para él) o **compartido** (visible para todos los usuarios tras moderación).
- **RF-08**: Si el documento se marca como compartido, el sistema debe pasarlo por un proceso de moderación automática (vía LLM) que valide que el contenido sea relevante a ERP y no contenga material inapropiado, antes de integrarlo a la base general.
- **RF-09**: El sistema debe rechazar y notificar al usuario si un documento compartido no pasa la moderación, indicando el motivo.
- **RF-10**: El sistema debe procesar los documentos subidos (extracción de texto, fragmentación/chunking, generación de embeddings) para integrarlos al vector store.

### Módulo 3: Chat conversacional (RAG)

- **RF-11**: El sistema debe permitir al usuario seleccionar un tema/módulo de aprendizaje (de la base predefinida o de sus documentos propios) antes de iniciar la conversación.
- **RF-12**: El sistema debe responder preguntas del usuario usando recuperación de contexto (RAG) limitado al tema/módulo seleccionado.
- **RF-13**: El sistema debe rechazar de forma amable y redirigir al usuario cuando la pregunta esté fuera del alcance de sistemas ERP, sin usar conocimiento general del LLM para responderla.
- **RF-14**: El sistema debe mantener el historial de la conversación dentro de una sesión de chat para dar continuidad contextual.
- **RF-15**: El sistema debe guardar el historial de conversaciones del usuario para consulta posterior.

### Módulo 4: Evaluaciones

- **RF-16**: El sistema debe permitir generar evaluaciones automáticas basadas en el tema/módulo seleccionado por el usuario.
- **RF-17**: El sistema debe soportar preguntas de opción múltiple, verdadero/falso, y preguntas abiertas.
- **RF-18**: Para preguntas de opción múltiple y verdadero/falso, el sistema debe calificar automáticamente comparando con la respuesta correcta.
- **RF-19**: Para preguntas abiertas, el sistema debe evaluar la respuesta del usuario mediante el LLM, generando una calificación numérica y retroalimentación cualitativa explicando los aciertos y errores.
- **RF-20**: El sistema debe calcular y mostrar un puntaje final consolidado al terminar la evaluación.
- **RF-21**: El sistema debe guardar el historial de evaluaciones (puntajes, fecha, tema) asociado al usuario.

### Módulo 5: Perfil y seguimiento de progreso

- **RF-22**: El sistema debe mostrar al usuario un resumen de su progreso (temas estudiados, evaluaciones realizadas, puntajes obtenidos).
- **RF-23**: El sistema debe permitir al usuario ver y eliminar los documentos propios que ha subido.

---

## Requerimientos no funcionales (RNF)

### Rendimiento

- **RNF-01**: El sistema debe responder a una consulta del chat (RAG) en un tiempo máximo de 5-8 segundos, considerando la latencia de recuperación de contexto + generación del LLM, para mantener una experiencia conversacional fluida durante la demo.
- **RNF-02**: La generación de una evaluación (5-10 preguntas) no debe tomar más de 15 segundos.
- **RNF-03**: El procesamiento de un documento subido (extracción + chunking + embeddings) para un PDF de hasta 20 páginas no debe exceder 30 segundos, mostrando un indicador de progreso al usuario mientras se procesa.

### Seguridad

- **RNF-04**: Las contraseñas de los usuarios deben almacenarse hasheadas (bcrypt o equivalente), nunca en texto plano.
- **RNF-05**: Las claves de API del LLM y demás credenciales sensibles deben gestionarse mediante variables de entorno, nunca hardcodeadas en el código ni expuestas en el frontend.
- **RNF-06**: El sistema debe validar que un usuario solo pueda acceder a sus propios documentos privados, historial y evaluaciones (control de acceso a nivel de backend, no solo de UI).
- **RNF-07**: Las comunicaciones entre frontend y backend deben usar HTTPS.
- **RNF-08**: El sistema debe sanitizar/validar todo input de usuario (mensajes de chat, archivos subidos) para prevenir inyecciones o cargas maliciosas, incluyendo validación de tipo y tamaño máximo de archivo (sugerido: máx. 10MB por documento).

### Usabilidad

- **RNF-09**: La interfaz debe ser responsive, usable correctamente tanto en laptop como en tablet/celular (considerando que en la feria el jurado podría revisar desde distintos dispositivos).
- **RNF-10**: El sistema debe mostrar mensajes de error claros y comprensibles para el usuario (no errores técnicos crudos) ante fallos del LLM, archivos corruptos, o tiempos de espera excedidos.
- **RNF-11**: El sistema debe mostrar indicadores de carga (loading states) durante operaciones que tomen más de 1-2 segundos (respuesta del chat, procesamiento de documentos, generación de evaluaciones).

### Disponibilidad y confiabilidad

- **RNF-12**: El sistema debe estar disponible y operativo durante el horario completo de la feria, con un plan de contingencia (ej. recarga rápida de la app, backend con reinicio automático ante caídas).
- **RNF-13**: Ante una falla del proveedor del LLM (timeout, error de API), el sistema debe manejar el error de forma controlada (reintento automático limitado + mensaje amigable), sin romper la sesión del usuario.
- **RNF-14**: El sistema debe persistir los datos de usuario (historial, evaluaciones, documentos) en una base de datos, evitando pérdida de información ante un reinicio del backend.

### Escalabilidad y mantenibilidad

- **RNF-15**: El código debe organizarse siguiendo la separación modular definida en la arquitectura (chat/RAG, evaluaciones, base de conocimiento, autenticación), de forma que un módulo pueda modificarse sin afectar directamente a los demás.
- **RNF-16**: El sistema debe estar preparado para soportar un crecimiento moderado de la base de conocimiento (documentos compartidos) sin degradación significativa en los tiempos de búsqueda del vector store, considerando el uso de índices apropiados.

### Costos (relevante por el uso de LLM vía API)

- **RNF-17**: El sistema debe controlar el consumo de tokens por sesión/usuario (por ejemplo, limitando el tamaño del contexto recuperado y el historial de chat enviado al LLM), para mantener costos de API predecibles durante el desarrollo y la demo.
- **RNF-18**: El sistema debe registrar (logging básico) el uso de la API del LLM (número de llamadas, errores) para poder monitorear consumo y detectar problemas antes del día de la feria.

### Compatibilidad

- **RNF-19**: El sistema debe funcionar correctamente en los navegadores modernos más comunes (Chrome, Edge, Firefox) en sus últimas dos versiones mayores.

---

## Notas de priorización

Dado el alcance acotado de un proyecto de feria (no un sistema en producción), se priorizan con mayor rigurosidad:

- **RNF-01, RNF-02, RNF-03** (rendimiento) — se notan directamente en una demo en vivo.
- **RNF-06, RNF-08** (seguridad básica) — control de acceso por backend y validación de input.
- **RNF-10, RNF-11** (usabilidad) — afectan la percepción de calidad frente al jurado.
- **RNF-17** (control de costos) — relevante incluso usando proveedores gratuitos, para evitar exceder límites de tasa (rate limits) durante pruebas.

Los RNF de escalabilidad amplia y compatibilidad extendida se contemplan en el diseño pero no requieren validación exhaustiva para el alcance de este proyecto.
