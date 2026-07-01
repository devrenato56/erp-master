-- Agrega soporte para archivar y eliminar (soft-delete) sesiones de chat.
-- Ejecutar en Supabase SQL Editor antes de desplegar los cambios en el backend.

ALTER TABLE public.sesion_chat
  ADD COLUMN IF NOT EXISTS archivada boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS eliminada_en timestamptz;

-- Índice para que el filtro IS NULL en eliminada_en sea eficiente
CREATE INDEX IF NOT EXISTS idx_sesion_chat_activa
  ON public.sesion_chat (usuario_id, iniciada_en DESC)
  WHERE eliminada_en IS NULL;
