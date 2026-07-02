-- ============================================================
-- Re-diseño ChatERP — Bloque A, paso 2: datos iniciales
-- Ejecutar DESPUÉS de 07_schema_modulos.sql
-- Idempotente: seguro de re-ejecutar (usa WHERE NOT EXISTS).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Crear los 5 módulos a partir de los temas actuales
--    Toma nombre y descripción de la tabla tema para no duplicar info.
-- ------------------------------------------------------------
insert into public.modulo (nombre, descripcion, orden, es_predefinido)
select
  t.nombre,
  t.descripcion,
  s.orden,
  true
from public.tema t
join (values
  ('Fundamentos de Sistemas ERP',         1),
  ('Implementación de ERP',               2),
  ('Gestión del Cambio Organizacional',   3),
  ('Ética Profesional en TI',             4),
  ('Capacitación y Desempeño Operativo',  5)
) as s(nombre, orden) on t.nombre = s.nombre
where not exists (
  select 1 from public.modulo m where m.nombre = t.nombre
);

-- ------------------------------------------------------------
-- 2. Vincular los temas actuales a su módulo correspondiente
--    (compatibilidad hacia atrás: sesiones y evaluaciones existentes
--     siguen apuntando a estos tema_id y siguen funcionando)
-- ------------------------------------------------------------
update public.tema t
set modulo_id = m.id,
    orden     = 0          -- orden 0 = sub-tema "legado" del módulo
from public.modulo m
where t.nombre = m.nombre
  and t.modulo_id is null;

-- ------------------------------------------------------------
-- 3. Insertar sub-temas nuevos — Módulo 1: Fundamentos de Sistemas ERP
-- ------------------------------------------------------------
insert into public.tema (nombre, descripcion, es_predefinido, modulo_id, orden)
select v.nombre, v.descripcion, true, m.id, v.orden
from public.modulo m,
(values
  (1, 'Qué es un ERP y evolución histórica',
      'Origen del concepto ERP, evolución desde los sistemas MRP hasta las plataformas ERP en la nube.'),
  (2, 'Módulos típicos de un ERP',
      'Principales módulos funcionales: finanzas, inventario, RRHH, ventas, producción y sus integraciones.'),
  (3, 'Beneficios y riesgos de adopción',
      'Ventajas operativas y estratégicas de implementar un ERP, y los principales riesgos a gestionar.'),
  (4, 'ERP vs. software de gestión tradicional',
      'Comparación de los sistemas ERP integrados frente a soluciones de software sectoriales o fragmentadas.')
) as v(orden, nombre, descripcion)
where m.nombre = 'Fundamentos de Sistemas ERP'
  and not exists (
    select 1 from public.tema t where t.nombre = v.nombre and t.modulo_id = m.id
  );

-- ------------------------------------------------------------
-- 4. Sub-temas — Módulo 2: Implementación de ERP
-- ------------------------------------------------------------
insert into public.tema (nombre, descripcion, es_predefinido, modulo_id, orden)
select v.nombre, v.descripcion, true, m.id, v.orden
from public.modulo m,
(values
  (1, 'Fases de un proyecto de implementación',
      'Etapas típicas: planificación, diseño, configuración, pruebas, go-live y post-implementación.'),
  (2, 'Factores críticos de éxito',
      'Variables que determinan si un proyecto ERP concluye en tiempo, costo y calidad esperados.'),
  (3, 'Migración de datos',
      'Estrategias de extracción, transformación y carga (ETL) de datos históricos al nuevo sistema ERP.'),
  (4, 'Errores comunes en la puesta en marcha',
      'Problemas frecuentes en el go-live: subestimación de tiempos, falta de capacitación y resistencia al cambio.')
) as v(orden, nombre, descripcion)
where m.nombre = 'Implementación de ERP'
  and not exists (
    select 1 from public.tema t where t.nombre = v.nombre and t.modulo_id = m.id
  );

-- ------------------------------------------------------------
-- 5. Sub-temas — Módulo 3: Gestión del Cambio Organizacional
-- ------------------------------------------------------------
insert into public.tema (nombre, descripcion, es_predefinido, modulo_id, orden)
select v.nombre, v.descripcion, true, m.id, v.orden
from public.modulo m,
(values
  (1, 'Qué es la resistencia al cambio y por qué ocurre',
      'Factores humanos y organizacionales que generan resistencia ante la adopción de un nuevo sistema ERP.'),
  (2, 'Estrategias de comunicación durante la transición',
      'Planes de comunicación, mensajes clave y canales para acompañar el proceso de cambio tecnológico.'),
  (3, 'Rol del liderazgo en la adopción',
      'Cómo los líderes de proyecto y directivos facilitan u obstaculizan la adopción del ERP en la organización.'),
  (4, 'Modelos de gestión del cambio',
      'Marcos de referencia aplicados a proyectos ERP: modelo ADKAR, los 8 pasos de Kotter y otros enfoques.')
) as v(orden, nombre, descripcion)
where m.nombre = 'Gestión del Cambio Organizacional'
  and not exists (
    select 1 from public.tema t where t.nombre = v.nombre and t.modulo_id = m.id
  );

-- ------------------------------------------------------------
-- 6. Sub-temas — Módulo 4: Ética Profesional en TI
-- ------------------------------------------------------------
insert into public.tema (nombre, descripcion, es_predefinido, modulo_id, orden)
select v.nombre, v.descripcion, true, m.id, v.orden
from public.modulo m,
(values
  (1, 'Confidencialidad y manejo de datos sensibles',
      'Obligaciones éticas y legales del profesional TI al trabajar con información organizacional crítica.'),
  (2, 'Integridad en el registro de información',
      'Responsabilidad sobre la exactitud, completitud y trazabilidad de los datos en un sistema ERP.'),
  (3, 'Responsabilidad profesional del implementador',
      'Alcance de las obligaciones del consultor o técnico frente al cliente durante y después del proyecto.'),
  (4, 'Dilemas éticos comunes en proyectos ERP',
      'Situaciones de conflicto de interés, presión de plazos y sesgos en la toma de decisiones técnicas.')
) as v(orden, nombre, descripcion)
where m.nombre = 'Ética Profesional en TI'
  and not exists (
    select 1 from public.tema t where t.nombre = v.nombre and t.modulo_id = m.id
  );

-- ------------------------------------------------------------
-- 7. Sub-temas — Módulo 5: Capacitación y Desempeño Operativo
-- ------------------------------------------------------------
insert into public.tema (nombre, descripcion, es_predefinido, modulo_id, orden)
select v.nombre, v.descripcion, true, m.id, v.orden
from public.modulo m,
(values
  (1, 'Diseño de programas de capacitación de usuarios',
      'Metodologías para estructurar un plan de formación de usuarios finales antes y después del go-live.'),
  (2, 'Medición del desempeño post-implementación',
      'Indicadores clave (KPIs) para evaluar si el ERP está generando el valor esperado en la operación.'),
  (3, 'Indicadores de adopción tecnológica',
      'Métricas de uso del sistema: tasa de adopción, errores de ingreso, tiempos de proceso y satisfacción del usuario.'),
  (4, 'Mejora continua del uso del sistema',
      'Ciclos de retroalimentación, actualizaciones y re-capacitación para maximizar el retorno del ERP a largo plazo.')
) as v(orden, nombre, descripcion)
where m.nombre = 'Capacitación y Desempeño Operativo'
  and not exists (
    select 1 from public.tema t where t.nombre = v.nombre and t.modulo_id = m.id
  );

-- ------------------------------------------------------------
-- Verificación rápida (opcional, podés correr esto para confirmar)
-- ------------------------------------------------------------
-- select m.orden, m.nombre as modulo,
--        count(t.id) filter (where t.orden > 0) as subtemas_nuevos,
--        count(t.id) filter (where t.orden = 0) as legado
-- from public.modulo m
-- left join public.tema t on t.modulo_id = m.id
-- group by m.id, m.orden, m.nombre
-- order by m.orden;
