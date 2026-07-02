# Plan de rediseño — ChatERP como plataforma tipo EdTech
## De "herramientas sueltas" a "curso guiado"

Este documento redefine la arquitectura de contenido del producto. No reemplaza `docs/plan-correcciones.md` (esos fixes de bugs siguen vigentes) — lo complementa y lo reordena: primero se corrige lo que está roto (Bloque 1 de ese plan), luego se construye esta nueva estructura sobre una base funcional.

---

## 1. Visión del cambio

**Antes:** 5 temas planos, cada uno con chat libre + evaluación de 8 preguntas + documentos sueltos. El usuario llega y no sabe por dónde empezar ni qué significa "terminar".

**Después:** un curso estructurado en **Módulos**, cada uno con **sub-temas** secuenciales. Cada módulo tiene: un resumen generado por IA antes de empezar, documentación accesible por sub-tema, un chat que puede ser guiado (con preguntas sugeridas) o libre, evaluaciones por sub-tema y una evaluación final de módulo. Adicionalmente, una sección de **Casos de empresa** donde el usuario aplica lo aprendido a una situación real subiendo documentación de un ERP específico.

**Analogía de referencia:** el modelo es el de una plataforma tipo Platzi/Coursera — Módulo = Curso, Sub-tema = Clase, Evaluación de módulo = Examen final del curso.

---

## 2. Modelo de datos — cambios necesarios

### 2.1 Nueva tabla `modulo`

Reemplaza conceptualmente a los "temas" actuales como unidad de nivel superior.

```sql
create table public.modulo (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  descripcion text,
  orden int not null,                        -- posición en la secuencia del curso
  resumen_ia text,                            -- resumen generado por IA, se muestra antes de entrar al módulo
  resumen_generado_en timestamptz,
  es_predefinido boolean not null default true,
  creado_en timestamptz not null default now()
);
```

### 2.2 Modificar tabla `tema` → pasa a ser "sub-tema" dentro de un módulo

```sql
alter table public.tema
  add column if not exists modulo_id uuid references public.modulo(id) on delete cascade,
  add column if not exists orden int not null default 0;
```

`tema.modulo_id` es obligatorio para los sub-temas del curso (no para casos de empresa, que usan su propia tabla — ver 2.4).

### 2.3 Progreso del usuario por módulo

```sql
create table public.progreso_modulo (
  id uuid primary key default uuid_generate_v4(),
  usuario_id uuid not null references public.usuario(id) on delete cascade,
  modulo_id uuid not null references public.modulo(id) on delete cascade,
  completado boolean not null default false,
  completado_en timestamptz,
  unique (usuario_id, modulo_id)
);
```

Se marca `completado = true` cuando el usuario aprueba la evaluación final de módulo (ver sección 5).

### 2.4 Nueva tabla `caso_empresa` (reemplaza el propósito de "documentos" genéricos)

```sql
create table public.caso_empresa (
  id uuid primary key default uuid_generate_v4(),
  usuario_id uuid not null references public.usuario(id) on delete cascade,
  modulo_id uuid references public.modulo(id) on delete set null,  -- opcional: asocia el caso a un módulo
  nombre text not null,                        -- ej. "ERP de Restaurante La Fonda"
  descripcion text,                            -- contexto que el usuario escribe sobre el caso
  documento_id uuid references public.documento(id) on delete cascade,  -- reutiliza la infraestructura de documento/chunk ya existente
  creado_en timestamptz not null default now()
);
```

La tabla `documento` y `chunk` ya existentes se **reutilizan tal cual** para el procesamiento (extracción, chunking, embeddings) — `caso_empresa` es una capa semántica encima que le da identidad de "caso de negocio" en vez de "documento suelto", y permite asociarlo opcionalmente a un módulo.

### 2.5 Modificar tabla `evaluacion` — soportar dos niveles

```sql
alter table public.evaluacion
  add column if not exists nivel text not null default 'tema' check (nivel in ('tema', 'modulo')),
  add column if not exists modulo_id uuid references public.modulo(id) on delete cascade;
```

- `nivel = 'tema'` → evaluación corta (4-5 preguntas), usa `tema_id` como ahora.
- `nivel = 'modulo'` → evaluación final (12-15 preguntas), usa `modulo_id`, cubre todos los sub-temas del módulo. Aprobarla (puntaje ≥ 11/20) dispara `progreso_modulo.completado = true`.

### 2.6 Migración de datos existentes

- Los 5 `tema` actuales se convierten en 5 filas de `modulo` (mismo nombre y descripción).
- Se crean sub-temas nuevos dentro de cada módulo (ver sección 4 — contenido necesario).
- El documento del PDF de la tesis (`Grupo 3 Avance 4.pdf`), actualmente asociado solo a "Gestión del Cambio Organizacional", se re-asocia a nivel de **todos los sub-temas relevantes** dentro de cada módulo correspondiente (siguiendo la Estrategia A de `plan-correcciones.md`: no filtrar estrictamente por un único tema, sino permitir que el retriever busque en el corpus completo cuando sea contenido oficial).
- Las evaluaciones/intentos ya generados en las capturas (ej. "17.4/20 Hoy") se conservan como `nivel = 'tema'` retroactivamente para no perder el historial.

---

## 3. Requerimientos funcionales nuevos (RF-24 en adelante)

### Navegación y estructura del curso

- **RF-24**: El sistema debe mostrar los módulos disponibles como una ruta de aprendizaje ordenada (secuencial por `orden`), no como una grilla plana sin jerarquía.
- **RF-25**: Cada módulo debe mostrar su estado de progreso: no iniciado / en progreso / completado, basado en `progreso_modulo`.
- **RF-26**: Al entrar a un módulo por primera vez, el sistema debe mostrar un resumen generado por IA (`modulo.resumen_ia`) antes de dar acceso a los sub-temas — un resumen ejecutivo de qué se va a aprender y por qué importa.
- **RF-27**: Dentro de un módulo, el usuario debe ver la lista de sub-temas con acceso a: documentación del sub-tema, chat específico del sub-tema, y evaluación corta del sub-tema.

### Chat guiado

- **RF-28**: Al iniciar un chat dentro de un sub-tema, el sistema debe sugerir 3-4 preguntas frecuentes predefinidas (chips o botones clickeables) además de permitir escritura libre — para que el usuario no enfrente una caja vacía sin saber qué preguntar.
- **RF-29**: El sistema debe seguir permitiendo un "chat general" libre (no atado a un sub-tema específico) para preguntas que crucen varios módulos.
- **RF-30**: Las preguntas frecuentes sugeridas por sub-tema deben generarse una vez (vía LLM, basadas en el contenido del sub-tema) y almacenarse, no regenerarse en cada sesión — para controlar costo de tokens (conecta con RNF-17).

### Evaluaciones de dos niveles

- **RF-31**: El sistema debe generar evaluaciones cortas por sub-tema (4-5 preguntas) accesibles desde la vista del sub-tema.
- **RF-32**: El sistema debe generar una evaluación final por módulo (12-15 preguntas, mezclando contenido de todos sus sub-temas) accesible solo cuando el usuario haya completado al menos una evaluación de cada sub-tema del módulo.
- **RF-33**: Aprobar la evaluación final de módulo (puntaje ≥ 11/20) debe marcar `progreso_modulo.completado = true` y desbloquear visualmente el siguiente módulo en la ruta.

### Casos de empresa

- **RF-34**: El sistema debe permitir crear un "caso de empresa": subir uno o más documentos (PDF/Word/texto) que describan el ERP específico de una organización real o hipotética, con un nombre y descripción dados por el usuario.
- **RF-35**: El usuario debe poder asociar opcionalmente un caso de empresa a un módulo del curso, para que el chat de ese caso combine el contexto del módulo (conceptos generales) con el contenido específico del documento subido (aplicación concreta).
- **RF-36**: El sistema debe permitir iniciar un chat específico sobre un caso de empresa, donde el RAG prioriza los chunks del documento del caso sobre la base de conocimiento general del módulo.
- **RF-37**: El sistema debe listar todos los casos de empresa del usuario en una sección dedicada ("Analiza tu empresa"), independiente de la navegación de módulos del curso.

---

## 4. Documentación necesaria — plan de contenido

Esto es lo más costoso del plan y lo que determina si el bot realmente "sabe" de ERP o solo tiene 5 etiquetas vacías. Se necesita, por cada uno de los 5 módulos, contenido dividido en sub-temas. Propuesta de estructura (ajustable):

### Módulo 1 — Fundamentos de Sistemas ERP
Sub-temas sugeridos: (1) Qué es un ERP y evolución histórica, (2) Módulos típicos de un ERP (finanzas, inventario, RRHH, ventas), (3) Beneficios y riesgos de adopción, (4) ERP vs. software de gestión tradicional.

### Módulo 2 — Implementación de ERP
Sub-temas sugeridos: (1) Fases de un proyecto de implementación, (2) Factores críticos de éxito, (3) Migración de datos, (4) Errores comunes en la puesta en marcha.

### Módulo 3 — Gestión del Cambio Organizacional
Sub-temas sugeridos: (1) Qué es la resistencia al cambio y por qué ocurre, (2) Estrategias de comunicación durante la transición, (3) Rol del liderazgo en la adopción, (4) Modelos de gestión del cambio (ej. ADKAR, Kotter).

### Módulo 4 — Ética Profesional en TI
Sub-temas sugeridos: (1) Confidencialidad y manejo de datos sensibles, (2) Integridad en el registro de información, (3) Responsabilidad profesional del implementador, (4) Dilemas éticos comunes en proyectos ERP.

### Módulo 5 — Capacitación y Desempeño Operativo
Sub-temas sugeridos: (1) Diseño de programas de capacitación de usuarios, (2) Medición del desempeño post-implementación, (3) Indicadores de adopción tecnológica, (4) Mejora continua del uso del sistema.

**Fuentes de contenido, en orden de prioridad:**

1. **El PDF de la tesis** (`Grupo 3 Avance 4.pdf`) — ya cubre bien Módulo 3 (Gestión del Cambio) y parcialmente Módulo 4 (Ética) y Módulo 5 (Capacitación), porque son las variables centrales de la investigación. Es la fuente más rápida de reutilizar.
2. **Contenido nuevo a crear** — Módulo 1 (Fundamentos) y Módulo 2 (Implementación) probablemente necesitan material adicional porque no son el foco central de la tesis. Recomendación: generar un archivo `.md` de 2,000-3,000 palabras por sub-tema de estos dos módulos, con Claude Code redactándolo con supervisión tuya para verificar precisión técnica.
3. **Las preguntas frecuentes sugeridas (RF-28)** necesitan generarse a partir del contenido ya cargado de cada sub-tema — esto es un paso de post-procesamiento, no una fuente nueva.

**Estimado de volumen total:** 5 módulos × 4 sub-temas × ~2,500 palabras promedio ≈ 50,000 palabras de contenido curado. Es significativo — priorizar los módulos que ya están cubiertos por el PDF de la tesis primero, y completar los faltantes según tiempo disponible.

---

## 5. Flujo de usuario (referencia para el diseño de UI)

```
Inicio (dashboard)
  └─ Ruta de aprendizaje: Módulo 1 → 2 → 3 → 4 → 5 (con estado de progreso)
       │
       └─ Entrar a un Módulo
            ├─ [Primera vez] Resumen generado por IA del módulo
            ├─ Lista de sub-temas
            │    ├─ Sub-tema 1
            │    │    ├─ Ver documentación
            │    │    ├─ Chat guiado (preguntas sugeridas + libre)
            │    │    └─ Evaluación corta (4-5 preguntas)
            │    ├─ Sub-tema 2 (ídem)
            │    └─ ...
            └─ Evaluación final de módulo (desbloqueada tras completar evaluaciones de sub-temas)
                 └─ Aprobar → progreso_modulo.completado = true → siguiente módulo se resalta

Analiza tu empresa (sección independiente)
  └─ Mis casos de empresa
       ├─ Crear nuevo caso: nombre + descripción + subir documento(s) + (opcional) asociar a un módulo
       └─ Caso existente
            └─ Chat del caso (contexto del documento + módulo asociado si aplica)
```

---

## 6. Plan de implementación por bloques

### Bloque A — Migración de datos (antes de tocar frontend)
- [ ] Ejecutar el SQL de la sección 2 (crear `modulo`, `progreso_modulo`, `caso_empresa`; alterar `tema` y `evaluacion`).
- [ ] Migrar los 5 `tema` actuales a `modulo` (mismo nombre/descripción, asignar `orden` 1-5).
- [ ] Redefinir sub-temas nuevos dentro de cada módulo según la sección 4, insertarlos en `tema` con su `modulo_id` correspondiente.
- [ ] Re-asociar los chunks existentes del PDF de la tesis a los sub-temas relevantes de cada módulo.

### Bloque B — Contenido (el más costoso, en paralelo con desarrollo)
- [ ] Procesar el PDF de la tesis por sub-tema donde ya aplica (Módulos 3, 4, 5).
- [ ] Redactar y procesar contenido nuevo para Módulos 1 y 2.
- [ ] Generar el resumen IA de cada módulo (`modulo.resumen_ia`) — un prompt que sintetice el contenido de todos sus sub-temas.
- [ ] Generar las preguntas frecuentes sugeridas por sub-tema (RF-28/RF-30).

### Bloque C — Backend
- [ ] Endpoints de módulos: `GET /modulos`, `GET /modulos/{id}` (con resumen IA y sub-temas), `GET /modulos/{id}/progreso`.
- [ ] Endpoints de evaluación de módulo: `POST /evaluaciones/modulo/{modulo_id}/generar`, lógica de desbloqueo según evaluaciones de sub-temas completadas.
- [ ] Endpoints de casos de empresa: `POST /casos-empresa`, `GET /casos-empresa`, `POST /casos-empresa/{id}/chat`.
- [ ] Modificar el retriever para soportar contexto combinado (módulo + caso de empresa) cuando el chat es de un caso asociado.

### Bloque D — Frontend
- [ ] Rediseñar `/inicio` como ruta de aprendizaje (módulos secuenciales con estado de progreso).
- [ ] Pantalla de módulo: resumen IA + lista de sub-temas.
- [ ] Pantalla de sub-tema: documentación + chat guiado (chips de preguntas sugeridas) + evaluación corta.
- [ ] Pantalla de evaluación final de módulo, con lógica de desbloqueo visible (ej. "Completa las 4 evaluaciones de sub-tema para desbloquear el examen final").
- [ ] Nueva sección "Analiza tu empresa": listado de casos, formulario de creación, chat del caso.

### Bloque E — Cierre
- [ ] Actualizar `AGENTS.md` y `README.md` con la nueva arquitectura de contenido (módulos > sub-temas, casos de empresa).
- [ ] Actualizar `docs/design-system.md` si se necesitan nuevos patrones visuales (ej. indicador de progreso de módulo, chips de preguntas sugeridas).

---

## 7. Preguntas abiertas para definir antes de construir

- [ ] **Secuencialidad estricta o libre**: ¿el usuario debe completar el Módulo 1 antes de acceder al Módulo 2, o todos los módulos están disponibles desde el inicio y el "progreso" es solo informativo?
- [ ] **Preguntas frecuentes sugeridas**: ¿se generan automáticamente vía LLM al cargar el contenido de cada sub-tema, o prefieres definirlas tú manualmente para tener control total sobre lo que el bot "invita" a preguntar?
- [ ] **Casos de empresa sin módulo asociado**: si un usuario sube un caso sin asociarlo a ningún módulo, ¿el chat de ese caso debe tener acceso a la base de conocimiento general de todos los módulos, o solo al documento subido?
