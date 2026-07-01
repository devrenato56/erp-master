-- ============================================================
-- Fix RLS: restringir documentos y chunks a usuarios autenticados
--
-- Problema detectado en cierre de Fase 3:
-- La política original de `documento` permitía que usuarios NO autenticados
-- (rol 'anon') vieran documentos con visibilidad='compartido' y
-- estado_moderacion='aprobado', porque la condición OR no tenía un check
-- de auth.role() = 'authenticated'.
--
-- Lo mismo aplica a la política de `chunk`, que hereda la lógica de documento.
--
-- Aplicar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- DOCUMENTO
DROP POLICY IF EXISTS "documento_select_propio_o_compartido" ON public.documento;

CREATE POLICY "documento_select_propio_o_compartido" ON public.documento
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND (
      usuario_id = auth.uid()
      OR (visibilidad = 'compartido' AND estado_moderacion = 'aprobado')
    )
  );

-- CHUNK
DROP POLICY IF EXISTS "chunk_select_segun_documento" ON public.chunk;

CREATE POLICY "chunk_select_segun_documento" ON public.chunk
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.documento d
      WHERE d.id = chunk.documento_id
        AND (
          d.usuario_id = auth.uid()
          OR (d.visibilidad = 'compartido' AND d.estado_moderacion = 'aprobado')
        )
    )
  );
