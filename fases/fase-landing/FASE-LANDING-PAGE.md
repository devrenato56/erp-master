# Landing page — ChatERP
## Brief para implementación con Claude Code

Archivo destino: `frontend/app/page.tsx`
Esta página es pública (no requiere autenticación). Si el usuario ya tiene sesión activa, redirigir a `/inicio`.

---

## Referencias visuales base

- **hackO.dev**: estructura general, barra de acento sobre label, stat cards con borde 1px, tipografía bold sin serif
- **Vercel (v0/Fluid)**: fondo negro puro, feature labels en monospace uppercase, mockup del producto como elemento visual
- **Next.js landing**: grid punteado tenue en el fondo del hero, CTAs limpios centrados
- Imágenes en `docs/inspo/landing/`

---

## Reglas de diseño (derivadas de `docs/design-system.md`)

- Fondo base: `var(--bg-base)` (`#0A0A0A`) — toda la página
- Acento único: `var(--accent)` (`#4ADE80`) — verde menta, solo para highlights, CTAs primarios y detalles
- Tipografía: Inter, sin fuentes adicionales
- Bordes: `1px solid var(--border)` para separar secciones y cards
- Radios: `--radius-sm` (4px) para botones, `--radius-md` (6px) para cards — nunca mayor a 8px
- Sin sombras decorativas, sin gradientes de fondo, sin ilustraciones 3D, sin animaciones complejas
- El único elemento visual permitido como "decoración" es un grid punteado/crosshatch muy sutil (`opacity: 0.04`) como textura de fondo en la sección hero

---

## Estructura de la página (sección por sección)

### 1. Navbar
```
[ChatERP logo]          [Iniciar sesión]  [Comenzar →]
```
- Posición: `fixed top-0`, `border-bottom: 1px solid var(--border)`, fondo `var(--bg-base)` con `backdrop-blur` sutil
- Logo: texto "ChatERP" con la barra vertical verde menta a la izquierda (igual al sidebar de la app)
- Links del navbar: solo dos — "Iniciar sesión" (ghost, lleva a `/login`) y "Comenzar →" (botón primario `--accent`, lleva a `/registro`)
- Sin otros links de navegación — es una landing para una feria, no un SaaS con múltiples páginas

### 2. Hero section
Centrado verticalmente, full viewport height.

**Estructura interna:**
```
[BARRA VERDE] ASISTENTE DE CAPACITACIÓN ERP         ← label pequeño, uppercase, --text-muted, con barra verde a la izquierda

Aprende ERP.
A tu ritmo. Con IA.                                  ← headline 56-64px, peso 700, --text-primary

Capacitación conversacional en sistemas ERP basada   ← subtítulo 16-18px, --text-secondary, máx 2 líneas
en inteligencia artificial. Practica, evalúate
y avanza a tu propio ritmo.

[Comenzar gratis →]  [Ver cómo funciona]            ← CTAs: primario verde, secundario ghost

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ← separador 1px --border

[Mockup del producto: screenshot de la pantalla de chat de la app]
```

**Mockup del producto:**
- Screenshot real de la pantalla `/chat/[sesionId]` de la app capturada (si no está disponible, usar un bloque visual con la estructura del chat — sidebar izquierdo + área de mensajes)
- Enmarcado en un contenedor con `border: 1px solid var(--border)`, `border-radius: --radius-md`, ligero `overflow: hidden`
- Ancho máximo: 800px, centrado
- Agrega `opacity: 0.9` para que no compita con el headline

**Textura de fondo:**
```css
background-image: radial-gradient(var(--border) 1px, transparent 1px);
background-size: 32px 32px;
opacity: 0.04; /* SOLO en esta sección, no en toda la página */
```

### 3. Sección de features (¿Qué puede hacer ChatERP?)
Estilo: grid de 3 columnas, cards con `border: 1px solid var(--border)`, sin sombra.

**Label de sección** (encima, igual al patrón hackO):
```
[BARRA VERDE] FUNCIONALIDADES                        ← small caps, --text-muted
¿Qué puede hacer ChatERP?                            ← 28-32px, peso 600
```

**3 feature cards:**

| Feature | Ícono (Lucide) | Título | Descripción |
|---|---|---|---|
| Chat RAG | `MessageSquare` | Chat conversacional | Conversa con el asistente sobre cualquier módulo ERP. Responde únicamente con base en el material del tema seleccionado. |
| Evaluaciones | `ClipboardCheck` | Evaluaciones automáticas | Genera preguntas de opción múltiple, V/F y abiertas. Recibe calificación y feedback inmediato generado por IA. |
| Documentos | `FileText` | Base de conocimiento | Sube tus propios materiales (PDF, Word, Markdown) para personalizar el asistente con el contenido que necesitas. |

Cada card:
- Padding: 24px
- Ícono en `--accent`, tamaño 20px
- Título: 15px, peso 500, `--text-primary`
- Descripción: 13-14px, `--text-secondary`
- Border: `1px solid var(--border)`
- Hover: `background: var(--bg-surface-hover)`
- Radio: `--radius-md`

### 4. Sección de cómo funciona (How it works)
Estilo inspirado en el layout de Vercel: texto a la izquierda, mockup/visual a la derecha.

**Estructura:**
```
[BARRA VERDE] FLUJO DE USO

Así funciona →                                       ← 28-32px, peso 600

01 — Selecciona un tema                              ← número en --accent, descripción en --text-secondary
02 — Conversa con el asistente
03 — Evalúa tu aprendizaje
04 — Revisa tu progreso
```

Los pasos en columna izquierda (40%), mockup de la pantalla de evaluaciones a la derecha (60%), con el mismo tratamiento visual del mockup del hero.

### 5. Footer mínimo
```
ChatERP  ·  Proyecto académico — Feria de proyectos 2026        [Iniciar sesión]  [Registrarse]
```
- Una sola línea, `border-top: 1px solid var(--border)`, padding 24px
- Texto en `--text-muted`
- Sin columnas de links, sin redes sociales, sin newsletter

---

## Comportamiento dinámico

- **Sesión activa**: si el usuario ya tiene sesión, redirigir automáticamente a `/inicio` al cargar la página. Usar `supabase.auth.getSession()` en un `useEffect`.
- **Scroll suave**: el botón "Ver cómo funciona" del hero hace scroll suave a la sección de features (`#features`).
- **Sin animaciones de entrada complejas**: a lo máximo un `opacity: 0 → 1` con `transition: 0.3s` en el hero al cargar. Nada de `framer-motion`, nada de `intersection observer` con animaciones por sección.

---

## Lo que NO debe hacer Claude Code al construir esto

- No usar gradientes de fondo (ni `bg-gradient-to-*`)
- No usar `rounded-xl`, `rounded-2xl` ni mayor — máximo `rounded` (4-6px equivalente)
- No agregar iconos coloridos o badges con múltiples colores
- No usar sombras decorativas (`shadow-lg`, `shadow-xl`) en cards
- No agregar animaciones de partículas, glows brillantes, ni parallax
- No poner más de dos colores activos en la misma vista (blanco/gris + verde menta)
- No inventar secciones adicionales no listadas en este brief
- No usar librerías de animación externas

---

## Archivos a crear/modificar

- `frontend/app/page.tsx` — página pública de landing (reemplaza el default de Next.js)
- No se necesitan otros archivos nuevos; los componentes del design system ya existen en el proyecto
