# Implementaciones — Fase 5: Evaluaciones

Registro de todo lo implementado durante la Fase 5, bloque por bloque.

---

## Bloque 1 — Generación de preguntas

### Archivo creado

**`backend/app/evaluaciones/service.py`**

#### Distribución de tipos

`_calcular_distribucion(n)` genera la lista de tipos para `n` preguntas respetando:
- `opcion_multiple`: 40%
- `verdadero_falso`: 30%
- `abierta`: 30%

Con ajuste automático para sumar exactamente `n` (redondeo hacia arriba en cada tipo, luego pop/push hasta ajustar). La lista se mezcla con `random.shuffle` para que los tipos no aparezcan agrupados.

#### Estrategia de recuperación de contexto

Se usan **3 queries complementarias** al retriever (umbral bajado a 0.30 para mayor cobertura):
1. `"conceptos fundamentales y definiciones del tema"`
2. `"implementación, fases y proceso del tema"`
3. `"beneficios, problemas y factores críticos del tema"`

Resultado: hasta 12 chunks únicos (deduplicados por `id`). Se seleccionan los 10 con mayor similitud para el contexto final (`max_chars=7000`). Esto garantiza cobertura de distintas partes del documento, no solo el fragmento más similar.

#### Prompt de generación

`_PROMPT_SISTEMA`: rol de docente experto en ERP, instrucción explícita de responder **solo con JSON puro** sin markdown.

`_PROMPT_USUARIO`: especifica la distribución exacta de tipos para esa generación, las reglas de formato por tipo, y el esquema JSON esperado:
```json
{
  "preguntas": [
    {
      "tipo": "opcion_multiple" | "verdadero_falso" | "abierta",
      "enunciado": "...",
      "opciones": ["a) ...", "b) ...", "c) ...", "d) ..."] | ["Verdadero", "Falso"] | null,
      "respuesta_correcta": "a" | "b" | "c" | "d" | "Verdadero" | "Falso" | null
    }
  ]
}
```

Reglas de formato por tipo:
- `opcion_multiple`: exactamente 4 opciones con prefijo `a)–d)`, `respuesta_correcta` = letra sola.
- `verdadero_falso`: opciones fijas `["Verdadero", "Falso"]`, `respuesta_correcta` = "Verdadero" o "Falso".
- `abierta`: `opciones = null`, `respuesta_correcta = null`.

#### Parsing y validación (`_parsear_preguntas`)

1. Elimina bloques markdown si el LLM los incluyó (` ``` ` al inicio y fin).
2. `json.loads()` — lanza `ValueError` si malformado.
3. Verifica que exista la clave `"preguntas"` como lista no vacía.
4. Por cada pregunta: valida tipo en `{opcion_multiple, verdadero_falso, abierta}`, enunciado no vacío, y que las no-abiertas tengan `respuesta_correcta`.

#### Reintentos ante JSON malformado

Bucle `for intento in range(1, 3)` — hasta 2 llamadas al LLM. Si ambas fallan, lanza `ValueError` con el último error. Si el LLM lanza `LLMError` (timeout / cuota), se propaga directamente (el router la convierte en HTTP 503).

#### Persistencia

1. `supabase.table("evaluacion").insert({tema_id, titulo})` → obtiene `evaluacion_id`.
2. `supabase.table("pregunta").insert(filas_preguntas)` → insert en batch de todas las preguntas.
3. Título auto-generado como `"Evaluación — {nombre_tema}"` si no se provee.

#### Interfaz pública

```python
@dataclass
class EvaluacionGenerada:
    evaluacion_id: str
    titulo: str
    tema_id: str
    preguntas: list[dict]   # incluye respuesta_correcta (solo para uso backend)

def generar_evaluacion(tema_id, n_preguntas=8, titulo=None) -> EvaluacionGenerada
```

### Verificación

Generación real sobre tema "Gestión del Cambio Organizacional" (119 chunks):
- JSON parseado en intento 1 ✅
- 8 preguntas generadas: 4 `opcion_multiple`, 2 `verdadero_falso`, 2 `abierta` ✅
- Todas las `opcion_multiple` con exactamente 4 opciones y `respuesta_correcta` en `{a,b,c,d}` ✅
- Todas las `verdadero_falso` con opciones `["Verdadero", "Falso"]` ✅
- Todas las `abierta` con `opciones=null` y `respuesta_correcta=null` ✅
- Preguntas coherentes con el contenido del PDF (gestión del cambio, implementación ERP, muestreo de investigación) ✅
- Evaluación persistida en Supabase: `evaluacion_id=651e0e7e...` con 8 preguntas ✅
- Tiempo de generación (retriever + LLM): ~4s (tokens=3469) ✅
