-- ============================================================
-- Auditoría de escalabilidad — Fase 7 Bloque 5
-- RNF-15: Verificar uso del índice HNSW en búsquedas vectoriales
-- RNF-16: Confirmar que match_chunks respeta el límite match_count
--
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- ------------------------------------------------------------
-- 1. Verificar que el índice HNSW existe
-- ------------------------------------------------------------

SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'chunk'
  AND indexname = 'idx_chunk_embedding';

-- Resultado esperado: una fila con indexdef conteniendo "USING hnsw"

-- ------------------------------------------------------------
-- 2. EXPLAIN ANALYZE: match_chunks con un embedding de ceros (benchmark)
--    El vector de ceros actúa como probe neutral — no importa la similitud,
--    solo interesa el plan de ejecución (¿usa Index Scan o Seq Scan?).
-- ------------------------------------------------------------

EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT
  c.id,
  c.documento_id,
  c.contenido,
  c.orden,
  (1 - (c.embedding <=> array_fill(0.0, ARRAY[384])::vector))::float AS similarity
FROM public.chunk c
JOIN public.documento d ON d.id = c.documento_id
WHERE
  d.estado_moderacion = 'aprobado'
  AND (1 - (c.embedding <=> array_fill(0.0, ARRAY[384])::vector)) >= 0.50
ORDER BY c.embedding <=> array_fill(0.0, ARRAY[384])::vector
LIMIT 5;

-- Resultado esperado: el plan debe incluir "Index Scan using idx_chunk_embedding"
-- Si aparece "Seq Scan on chunk", el índice no se está usando.

-- ------------------------------------------------------------
-- 3. EXPLAIN ANALYZE: match_chunks filtrado por tema_id
--    Verifica que el filtro por tema no elimine el uso del índice HNSW.
-- ------------------------------------------------------------

-- Reemplazar <UUID_DE_UN_TEMA> por un UUID real de la tabla tema.
-- Para obtener un tema: SELECT id, nombre FROM public.tema LIMIT 3;

EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT
  c.id,
  c.documento_id,
  c.contenido,
  c.orden,
  (1 - (c.embedding <=> array_fill(0.0, ARRAY[384])::vector))::float AS similarity
FROM public.chunk c
JOIN public.documento d ON d.id = c.documento_id
WHERE
  d.estado_moderacion = 'aprobado'
  AND d.tema_id = '<UUID_DE_UN_TEMA>'
  AND (1 - (c.embedding <=> array_fill(0.0, ARRAY[384])::vector)) >= 0.50
ORDER BY c.embedding <=> array_fill(0.0, ARRAY[384])::vector
LIMIT 5;

-- ------------------------------------------------------------
-- 4. Verificar parámetros HNSW del índice (m y ef_construction)
-- ------------------------------------------------------------

SELECT
  a.amname AS tipo_indice,
  i.relname AS indice,
  p.attoptions AS opciones_columna
FROM pg_index ix
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_class t ON t.oid = ix.indrelid
JOIN pg_am a ON a.oid = i.relam
LEFT JOIN pg_attribute p ON p.attrelid = ix.indexrelid AND p.attnum = 1
WHERE t.relname = 'chunk'
  AND a.amname = 'hnsw';

-- ------------------------------------------------------------
-- 5. Conteo de chunks por tema (referencia de escala actual)
-- ------------------------------------------------------------

SELECT
  te.nombre AS tema,
  COUNT(c.id) AS total_chunks,
  COUNT(DISTINCT c.documento_id) AS documentos
FROM public.chunk c
JOIN public.documento d ON d.id = c.documento_id
JOIN public.tema te ON te.id = d.tema_id
WHERE d.estado_moderacion = 'aprobado'
GROUP BY te.nombre
ORDER BY total_chunks DESC;

-- Referencia: HNSW escala bien hasta millones de vectores de 384 dims.
-- Para la escala actual del sistema (demo/educativa) no hay riesgo de degradación.

-- ------------------------------------------------------------
-- 6. Verificar configuración de ef_search en sesión (velocidad vs recall)
-- ------------------------------------------------------------

SHOW hnsw.ef_search;
-- Default: 40. Valores más altos = mejor recall, más lento.
-- Para este proyecto el default es adecuado.
