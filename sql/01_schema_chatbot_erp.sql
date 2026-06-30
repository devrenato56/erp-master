-- ============================================================
-- Chatbot de capacitación ERP — esquema de base de datos
-- Motor: Supabase (PostgreSQL + pgvector)
-- ============================================================

-- ------------------------------------------------------------
-- 1. EXTENSIONES
-- ------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists vector;

-- ------------------------------------------------------------
-- 2. TABLAS
-- ------------------------------------------------------------

-- Usuarios de la aplicación (perfil extendido sobre auth.users de Supabase)
create table public.usuario (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  correo text not null unique,
  rol text not null default 'usuario' check (rol in ('usuario', 'admin')),
  creado_en timestamptz not null default now()
);

-- Catálogo de temas / módulos de aprendizaje
create table public.tema (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  descripcion text,
  es_predefinido boolean not null default false,
  creado_en timestamptz not null default now()
);

-- Documentos subidos (base o material propio del usuario)
create table public.documento (
  id uuid primary key default uuid_generate_v4(),
  usuario_id uuid not null references public.usuario(id) on delete cascade,
  tema_id uuid references public.tema(id) on delete set null,
  nombre_archivo text not null,
  formato text not null check (formato in ('pdf', 'docx', 'txt', 'md')),
  storage_path text not null,     -- ruta del archivo original dentro del bucket de Supabase Storage
  visibilidad text not null default 'privado' check (visibilidad in ('privado', 'compartido')),
  estado_moderacion text not null default 'pendiente'
    check (estado_moderacion in ('pendiente', 'aprobado', 'rechazado')),
  motivo_rechazo text,
  subido_en timestamptz not null default now()
);

-- Fragmentos de documentos con embeddings (RAG)
-- Dimensión 384 = all-MiniLM-L6-v2 (sentence-transformers, modelo local gratuito).
-- Si cambian de modelo de embeddings, este valor debe ajustarse y la tabla recrearse.
create table public.chunk (
  id uuid primary key default uuid_generate_v4(),
  documento_id uuid not null references public.documento(id) on delete cascade,
  contenido text not null,
  embedding vector(384),
  orden int not null
);

-- Sesiones de chat
create table public.sesion_chat (
  id uuid primary key default uuid_generate_v4(),
  usuario_id uuid not null references public.usuario(id) on delete cascade,
  tema_id uuid references public.tema(id) on delete set null,
  iniciada_en timestamptz not null default now()
);

-- Mensajes dentro de una sesión de chat
create table public.mensaje (
  id uuid primary key default uuid_generate_v4(),
  sesion_id uuid not null references public.sesion_chat(id) on delete cascade,
  rol_emisor text not null check (rol_emisor in ('usuario', 'asistente')),
  contenido text not null,
  enviado_en timestamptz not null default now()
);

-- Evaluaciones (plantillas generadas por tema)
create table public.evaluacion (
  id uuid primary key default uuid_generate_v4(),
  tema_id uuid not null references public.tema(id) on delete cascade,
  titulo text not null,
  generada_en timestamptz not null default now()
);

-- Preguntas de una evaluación
create table public.pregunta (
  id uuid primary key default uuid_generate_v4(),
  evaluacion_id uuid not null references public.evaluacion(id) on delete cascade,
  tipo text not null check (tipo in ('opcion_multiple', 'verdadero_falso', 'abierta')),
  enunciado text not null,
  opciones jsonb,                 -- ej. ["a) ...", "b) ...", "c) ..."] (null para preguntas abiertas)
  respuesta_correcta text         -- referencia/clave (no aplica como nota final en preguntas abiertas)
);

-- Intentos de un usuario sobre una evaluación
create table public.intento_evaluacion (
  id uuid primary key default uuid_generate_v4(),
  usuario_id uuid not null references public.usuario(id) on delete cascade,
  evaluacion_id uuid not null references public.evaluacion(id) on delete cascade,
  puntaje_total numeric(5,2),
  completado_en timestamptz
);

-- Respuestas individuales dentro de un intento
create table public.respuesta_usuario (
  id uuid primary key default uuid_generate_v4(),
  intento_id uuid not null references public.intento_evaluacion(id) on delete cascade,
  pregunta_id uuid not null references public.pregunta(id) on delete cascade,
  respuesta_dada text,
  puntaje_obtenido numeric(5,2),
  feedback_llm text,
  respondido_en timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3. ÍNDICES
-- ------------------------------------------------------------

-- Búsquedas frecuentes por usuario
create index idx_documento_usuario on public.documento(usuario_id);
create index idx_sesion_chat_usuario on public.sesion_chat(usuario_id);
create index idx_intento_evaluacion_usuario on public.intento_evaluacion(usuario_id);

-- Búsquedas por tema
create index idx_documento_tema on public.documento(tema_id);
create index idx_evaluacion_tema on public.evaluacion(tema_id);

-- Mensajes ordenados por sesión
create index idx_mensaje_sesion on public.mensaje(sesion_id, enviado_en);

-- Filtrado de documentos compartidos y aprobados (lo que alimenta la base general del RAG)
create index idx_documento_compartido_aprobado
  on public.documento(visibilidad, estado_moderacion)
  where visibilidad = 'compartido' and estado_moderacion = 'aprobado';

-- Índice vectorial para búsqueda de similitud (RAG) usando HNSW
create index idx_chunk_embedding on public.chunk
  using hnsw (embedding vector_cosine_ops);

-- ------------------------------------------------------------
-- 4. TRIGGER: crear fila en public.usuario al registrarse en Supabase Auth
-- ------------------------------------------------------------
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.usuario (id, nombre, correo)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombre', new.email), new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------

alter table public.usuario enable row level security;
alter table public.tema enable row level security;
alter table public.documento enable row level security;
alter table public.chunk enable row level security;
alter table public.sesion_chat enable row level security;
alter table public.mensaje enable row level security;
alter table public.evaluacion enable row level security;
alter table public.pregunta enable row level security;
alter table public.intento_evaluacion enable row level security;
alter table public.respuesta_usuario enable row level security;

-- USUARIO: cada quien ve y edita solo su propio perfil
create policy "usuario_select_propio" on public.usuario
  for select using (auth.uid() = id);

create policy "usuario_update_propio" on public.usuario
  for update using (auth.uid() = id);

-- TEMA: lectura abierta a todos los autenticados (catálogo público)
create policy "tema_select_autenticados" on public.tema
  for select using (auth.role() = 'authenticated');

-- DOCUMENTO: el dueño ve los suyos (privados o no); cualquiera ve los compartidos+aprobados
create policy "documento_select_propio_o_compartido" on public.documento
  for select using (
    usuario_id = auth.uid()
    or (visibilidad = 'compartido' and estado_moderacion = 'aprobado')
  );

create policy "documento_insert_propio" on public.documento
  for insert with check (usuario_id = auth.uid());

create policy "documento_delete_propio" on public.documento
  for delete using (usuario_id = auth.uid());

-- CHUNK: visible si el documento asociado es visible para el usuario (hereda la regla de documento)
create policy "chunk_select_segun_documento" on public.chunk
  for select using (
    exists (
      select 1 from public.documento d
      where d.id = chunk.documento_id
        and (d.usuario_id = auth.uid()
             or (d.visibilidad = 'compartido' and d.estado_moderacion = 'aprobado'))
    )
  );

-- SESION_CHAT y MENSAJE: estrictamente privados al dueño
create policy "sesion_chat_propia" on public.sesion_chat
  for all using (usuario_id = auth.uid());

create policy "mensaje_segun_sesion_propia" on public.mensaje
  for all using (
    exists (
      select 1 from public.sesion_chat s
      where s.id = mensaje.sesion_id and s.usuario_id = auth.uid()
    )
  );

-- EVALUACION y PREGUNTA: lectura abierta a todos los autenticados (son plantillas compartidas)
create policy "evaluacion_select_autenticados" on public.evaluacion
  for select using (auth.role() = 'authenticated');

create policy "pregunta_select_autenticados" on public.pregunta
  for select using (auth.role() = 'authenticated');

-- INTENTO_EVALUACION y RESPUESTA_USUARIO: estrictamente privados al dueño
create policy "intento_evaluacion_propio" on public.intento_evaluacion
  for all using (usuario_id = auth.uid());

create policy "respuesta_usuario_segun_intento_propio" on public.respuesta_usuario
  for all using (
    exists (
      select 1 from public.intento_evaluacion i
      where i.id = respuesta_usuario.intento_id and i.usuario_id = auth.uid()
    )
  );

-- NOTA: las operaciones de escritura sobre documento (cambio de estado_moderacion),
-- chunk (inserción de embeddings), evaluacion y pregunta (generación por IA) se realizan
-- típicamente desde el backend usando la service_role key, que ignora RLS por diseño.
-- No se crean políticas de insert/update abiertas para esas tablas desde el cliente.

-- ------------------------------------------------------------
-- 6. SUPABASE STORAGE (archivos originales de documentos)
-- ------------------------------------------------------------
-- Convención de storage_path: '{usuario_id}/{documento_id}.{formato}'
-- Esto permite que las políticas de Storage usen el primer segmento de la ruta
-- para identificar al dueño del archivo, sin necesidad de consultar la tabla documento.

-- Crear el bucket (privado: el acceso se controla por políticas, no por URL pública)
insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', false)
on conflict (id) do nothing;

-- Lectura: el dueño del archivo puede leer lo suyo (carpeta = su propio usuario_id)
create policy "storage_select_propio"
  on storage.objects for select
  using (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Lectura: cualquier usuario autenticado puede leer archivos de documentos
-- compartidos y aprobados (se valida cruzando con la tabla documento vía storage_path)
create policy "storage_select_compartido_aprobado"
  on storage.objects for select
  using (
    bucket_id = 'documentos'
    and exists (
      select 1 from public.documento d
      where d.storage_path = storage.objects.name
        and d.visibilidad = 'compartido'
        and d.estado_moderacion = 'aprobado'
    )
  );

-- Inserción: un usuario solo puede subir archivos dentro de su propia carpeta
create policy "storage_insert_propio"
  on storage.objects for insert
  with check (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Eliminación: un usuario solo puede borrar archivos de su propia carpeta
create policy "storage_delete_propio"
  on storage.objects for delete
  using (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- NOTA: no se crean políticas de "update" sobre storage.objects; si necesitan
-- reemplazar un archivo, el flujo recomendado es borrar + volver a subir,
-- lo cual mantiene consistencia con el estado_moderacion (que vuelve a 'pendiente').
