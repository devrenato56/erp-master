-- ============================================================
-- Re-diseño ChatERP — Bloque A, paso 1: DDL de nuevas tablas
-- Ejecutar ANTES de 08_datos_modulos.sql
-- ============================================================

-- ------------------------------------------------------------
-- 1. NUEVA TABLA: modulo
--    Reemplaza al tema como unidad de nivel superior del curso.
-- ------------------------------------------------------------
create table if not exists public.modulo (
  id               uuid primary key default uuid_generate_v4(),
  nombre           text not null,
  descripcion      text,
  orden            int  not null,
  resumen_ia       text,                      -- generado por LLM, se muestra antes de entrar al módulo
  resumen_generado_en timestamptz,
  es_predefinido   boolean not null default true,
  creado_en        timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. NUEVA TABLA: progreso_modulo
--    Rastrea si el usuario completó la evaluación final del módulo.
-- ------------------------------------------------------------
create table if not exists public.progreso_modulo (
  id           uuid primary key default uuid_generate_v4(),
  usuario_id   uuid not null references public.usuario(id)  on delete cascade,
  modulo_id    uuid not null references public.modulo(id)   on delete cascade,
  completado   boolean not null default false,
  completado_en timestamptz,
  unique (usuario_id, modulo_id)
);

-- ------------------------------------------------------------
-- 3. NUEVA TABLA: caso_empresa
--    Capa semántica sobre documento/chunk existente;
--    permite crear un contexto de "ERP de empresa real".
-- ------------------------------------------------------------
create table if not exists public.caso_empresa (
  id            uuid primary key default uuid_generate_v4(),
  usuario_id    uuid not null references public.usuario(id)       on delete cascade,
  modulo_id     uuid          references public.modulo(id)        on delete set null,
  nombre        text not null,
  descripcion   text,
  documento_id  uuid          references public.documento(id)     on delete cascade,
  creado_en     timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 4. MODIFICAR: tabla tema → agrega modulo_id y orden
--    modulo_id: a qué módulo pertenece este sub-tema
--    orden: posición dentro del módulo
-- ------------------------------------------------------------
alter table public.tema
  add column if not exists modulo_id uuid references public.modulo(id) on delete cascade,
  add column if not exists orden int not null default 0;

-- ------------------------------------------------------------
-- 5. MODIFICAR: tabla evaluacion → soporta dos niveles
--    nivel='tema'   → evaluación corta (4-5 preguntas), usa tema_id
--    nivel='modulo' → evaluación final (12-15 preguntas), usa modulo_id
--    tema_id pasa a ser nullable para evaluaciones de módulo
-- ------------------------------------------------------------
alter table public.evaluacion
  add column if not exists nivel     text default 'tema' check (nivel in ('tema', 'modulo')),
  add column if not exists modulo_id uuid references public.modulo(id) on delete cascade;

-- Hacer tema_id nullable para que las evaluaciones de módulo no lo requieran
alter table public.evaluacion
  alter column tema_id drop not null;

-- Marcar evaluaciones existentes como nivel='tema'
update public.evaluacion set nivel = 'tema' where nivel is null;

-- Ahora aplicar NOT NULL al campo nivel
alter table public.evaluacion
  alter column nivel set not null;

-- ------------------------------------------------------------
-- 6. ÍNDICES
-- ------------------------------------------------------------
create index if not exists idx_tema_modulo   on public.tema(modulo_id);
create index if not exists idx_progreso_user on public.progreso_modulo(usuario_id);
create index if not exists idx_caso_usuario  on public.caso_empresa(usuario_id);

-- ------------------------------------------------------------
-- 7. RLS
-- ------------------------------------------------------------
alter table public.modulo          enable row level security;
alter table public.progreso_modulo enable row level security;
alter table public.caso_empresa    enable row level security;

-- MODULO: lectura abierta para autenticados (catálogo del curso)
create policy "modulo_select_autenticados" on public.modulo
  for select using (auth.role() = 'authenticated');

-- PROGRESO_MODULO: cada usuario accede solo a su propio progreso
create policy "progreso_modulo_propio" on public.progreso_modulo
  for all using (usuario_id = auth.uid());

-- CASO_EMPRESA: cada usuario gestiona solo sus propios casos
create policy "caso_empresa_propio" on public.caso_empresa
  for all using (usuario_id = auth.uid());
