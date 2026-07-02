-- ============================================================
-- Re-diseño ChatERP — Bloque C, soporte de base de datos
-- Ejecutar DESPUÉS de 07 y 08.
-- ============================================================

-- ------------------------------------------------------------
-- 1. sesion_chat: agrega caso_empresa_id (FK opcional)
--    Una sesión puede estar asociada a un caso de empresa
--    en lugar de (o además de) un tema.
-- ------------------------------------------------------------
ALTER TABLE public.sesion_chat
  ADD COLUMN IF NOT EXISTS caso_empresa_id uuid
    REFERENCES public.caso_empresa(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sesion_chat_caso
  ON public.sesion_chat (caso_empresa_id)
  WHERE caso_empresa_id IS NOT NULL;

-- ------------------------------------------------------------
-- 2. tema: agrega preguntas_sugeridas (jsonb — array de strings)
--    RF-28/RF-30: preguntas frecuentes generadas una vez por LLM
--    y almacenadas para no regenerarlas en cada sesión.
-- ------------------------------------------------------------
ALTER TABLE public.tema
  ADD COLUMN IF NOT EXISTS preguntas_sugeridas jsonb;

-- ------------------------------------------------------------
-- 3. RPC: match_chunks_by_documento
--    Búsqueda vectorial dentro de un documento específico,
--    sin filtrar por estado_moderacion (el usuario es dueño del doc).
--    Usada para el chat de casos de empresa.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.match_chunks_by_documento(
  query_embedding  vector(384),
  p_documento_id   uuid,
  match_threshold  float DEFAULT 0.30,
  match_count      int   DEFAULT 5
)
RETURNS TABLE (
  id           uuid,
  documento_id uuid,
  contenido    text,
  orden        int,
  similarity   float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    c.id,
    c.documento_id,
    c.contenido,
    c.orden,
    (1 - (c.embedding <=> query_embedding))::float AS similarity
  FROM public.chunk c
  WHERE c.documento_id = p_documento_id
    AND (1 - (c.embedding <=> query_embedding)) >= match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;
