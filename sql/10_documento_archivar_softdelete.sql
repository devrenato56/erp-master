-- Agrega soporte para archivar y eliminar (soft-delete) documentos.
-- Ejecutar en Supabase SQL Editor antes de desplegar los cambios en el backend.

ALTER TABLE public.documento
  ADD COLUMN IF NOT EXISTS archivada_en  timestamptz,
  ADD COLUMN IF NOT EXISTS eliminada_en  timestamptz;

-- Índice para listar documentos activos eficientemente
CREATE INDEX IF NOT EXISTS idx_documento_activo
  ON public.documento (usuario_id, subido_en DESC)
  WHERE eliminada_en IS NULL AND archivada_en IS NULL;
