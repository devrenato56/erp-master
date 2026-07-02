# Fases de un proyecto de implementación de ERP

## Por qué implementar un ERP es un proyecto, no una instalación

Un error común es pensar en la implementación de un ERP como una "instalación de software": se compra la licencia, se instala el programa, se capacita a los usuarios y listo. La realidad es radicalmente diferente. Implementar un ERP es un proyecto de transformación organizacional, donde el software es solo una parte —y no siempre la parte más difícil.

Un proyecto de ERP para una empresa mediana puede durar entre 6 meses y 2 años, involucrar a decenas o cientos de personas, y requerir la redefinición de prácticamente todos los procesos de negocio. Entender las fases de este proyecto es fundamental para cualquier profesional que trabaje en el área.

## Las fases estándar de una implementación ERP

Aunque los metodologías varían entre proveedores (SAP tiene su metodología ASAP/Activate, Oracle tiene su AIM, Microsoft tiene SureStep), todas convergen en las mismas fases fundamentales:

## Fase 1: Planificación y preparación del proyecto

Antes de tocar el software, se define el marco general del proyecto. Esta fase establece las bases sobre las que todo lo demás se construirá.

**Definición del alcance.** ¿Qué módulos se implementarán? ¿Qué procesos quedarán dentro y cuáles fuera del ERP en esta primera fase? ¿Qué unidades de negocio, plantas o países están incluidos? Un alcance mal definido es la principal causa de sobrecostos.

**Formación del equipo del proyecto.** Se define quién participa y en qué rol:
- *Sponsor ejecutivo:* el directivo que patrocina el proyecto, toma decisiones estratégicas y destina recursos.
- *Gerente de proyecto:* responsable de la ejecución diaria, cronograma y presupuesto.
- *Líderes funcionales / usuarios clave (Key Users):* expertos de cada área del negocio (finanzas, logística, producción) que conocen los procesos actuales y participarán en el diseño de los nuevos.
- *Equipo técnico del proveedor o consultor:* los especialistas del ERP que configurarán el sistema.
- *Equipo de TI interno:* responsable de infraestructura, seguridad y soporte técnico.

**Cronograma y presupuesto.** Se estiman los plazos y costos de cada fase. En esta etapa conviene incluir un margen de contingencia del 20-30% sobre el estimado inicial, dado que los proyectos ERP frecuentemente encuentran complejidades no previstas.

**Plan de gestión del cambio.** Se define cómo se comunicará el proyecto a la organización, cómo se gestionará la resistencia al cambio y qué plan de capacitación se seguirá.

## Fase 2: Análisis y diseño (Blueprint / Fit-Gap)

Esta es la fase intelectualmente más intensiva del proyecto. Su objetivo es entender los procesos actuales de la empresa y diseñar cómo serán en el nuevo sistema.

**Relevamiento de procesos actuales (As-Is).** Los consultores y usuarios clave documentan cómo funciona cada proceso hoy: quién hace qué, con qué información, con qué sistemas, con qué excepciones. Este relevamiento revela invariablemente procesos que nadie había documentado antes, excepciones que "siempre se hicieron así" y datos que se procesan de formas inesperadas.

**Análisis de brecha (Gap Analysis / Fit-Gap).** Se compara cómo funciona la empresa (As-Is) con cómo funcionaría en el ERP estándar (To-Be). Las diferencias son las "brechas" (gaps). Para cada brecha se define cómo se resolverá:
- *Fit:* el proceso estándar del ERP cubre la necesidad tal como está. No requiere desarrollo adicional.
- *Gap que se cierra con configuración:* el ERP lo puede hacer, pero requiere parametrización específica.
- *Gap que requiere personalización (customization):* el ERP estándar no lo cubre y se debe desarrollar funcionalidad adicional.
- *Gap que se cierra adaptando el proceso:* la empresa adapta su proceso para ajustarse al estándar del ERP.

**Esta última opción es frecuentemente la mejor.** Los ERP incorporan "mejores prácticas" probadas en miles de implementaciones. Cuando la empresa adapta su proceso al estándar del ERP en lugar de personalizar el sistema, se beneficia de esas mejores prácticas y reduce el costo y la complejidad del proyecto.

**Diseño del sistema (To-Be).** Se documenta cómo quedarán los procesos en el nuevo sistema: flujos de trabajo, pantallas que se usarán, roles y permisos, reportes requeridos. Este documento (el "Blueprint" en terminología SAP) es el contrato técnico del proyecto.

**Diseño de datos maestros.** Se define la estructura de los datos que el sistema necesita: plan de cuentas, jerarquía organizativa, estructura de materiales, clasificación de clientes y proveedores.

## Fase 3: Configuración y desarrollo

Con el Blueprint aprobado, el equipo técnico configura el sistema.

**Configuración del sistema.** Los consultores parametrizan el ERP según el diseño definido: crean la estructura organizativa (sociedad, centros de costo, plantas), configuran los módulos seleccionados, definen los flujos de aprobación, crean los formularios de impresión (facturas, órdenes de compra), y configuran los reportes requeridos.

**Desarrollo de personalizaciones.** Para los gaps que no se pueden resolver con configuración estándar, se desarrollan programas adicionales: interfaces con otros sistemas, reportes especiales, funcionalidades específicas del negocio. Las personalizaciones deben controlarse estrictamente: cada una añade complejidad, costo de mantenimiento y riesgo en las actualizaciones futuras del sistema.

**Integración con sistemas externos.** Si el ERP debe intercambiar datos con otros sistemas (sistema bancario, portales de facturación electrónica, plataformas de e-commerce, sistemas de clientes o proveedores), se desarrollan e implementan las interfaces correspondientes.

**Migración de datos (diseño).** En paralelo con la configuración, se diseña el proceso de migración: qué datos se migrarán al nuevo sistema, de qué sistemas fuente se extraerán, qué transformaciones necesitan y en qué secuencia se cargarán.

## Fase 4: Pruebas

Esta fase verifica que el sistema configurado funciona correctamente antes de entregar a los usuarios y antes del go-live.

**Pruebas unitarias.** Cada consultor verifica que la configuración de su módulo funciona correctamente en escenarios individuales.

**Pruebas de integración.** Se prueban los flujos completos de extremo a extremo: desde el pedido de venta hasta el cobro, desde la solicitud de compra hasta el pago. Estas pruebas revelan problemas de integración entre módulos que no aparecen en las pruebas unitarias.

**Pruebas de aceptación del usuario (UAT - User Acceptance Testing).** Los usuarios clave (no el equipo técnico) prueban el sistema con escenarios reales de su trabajo diario. Este es el momento en que los usuarios validan que el sistema hace lo que esperan. Los errores y los "no funciona como esperaba" que aparecen aquí son el material del proceso de ajuste previo al go-live.

**Pruebas de carga y rendimiento.** Se verifica que el sistema puede manejar el volumen de transacciones esperado sin degradar el rendimiento.

**Pruebas de migración de datos.** Se realizan cargas de prueba de los datos maestros y transaccionales para verificar que la migración funciona correctamente y que los datos migrados se ven bien en el sistema.

## Fase 5: Capacitación de usuarios finales

Esta fase es frecuentemente subestimada en tiempo y presupuesto, con consecuencias serias en el go-live.

Los "key users" que participaron en el proyecto ya conocen el sistema bien. Pero la gran mayoría de los empleados que usarán el ERP en el día a día no han tenido contacto con él. Esta fase los prepara.

**Desarrollo de material de capacitación.** Manuales, guías rápidas, videos de tutoriales adaptados a cada rol. No todos los usuarios necesitan aprender todo el sistema: el operador de almacén necesita saber cómo registrar entradas y salidas; el contador necesita saber cómo hacer cierres contables.

**Ejecución de capacitaciones.** Sesiones presenciales o virtuales por grupo de usuarios, usando el sistema configurado con datos de prueba. Lo ideal es capacitar en el sistema final, no en versiones anteriores o con datos ficticios muy diferentes a la realidad.

**Entrenamiento en los nuevos procesos, no solo en el sistema.** Un error común es capacitar solo en "cómo usar el sistema" sin explicar "por qué el proceso cambia y cómo fluye de aquí en adelante". Los usuarios que entienden el porqué adoptan mucho mejor que los que solo aprenden a presionar botones.

## Fase 6: Go-Live y estabilización

El go-live es el momento en que el sistema pasa a producción real. Es el período de mayor tensión del proyecto.

**Preparación final del go-live.** Última migración de datos con datos al corte definido, cierre de los sistemas anteriores, verificaciones finales de configuración, plan de soporte reforzado.

**Estrategias de go-live:**
- *Big Bang:* toda la empresa pasa al nuevo sistema simultáneamente en una fecha. Mayor riesgo, pero más rápido y sin necesidad de mantener interfaces entre sistemas nuevos y viejos.
- *Por fases:* se implementa módulo por módulo o unidad por unidad. Menor riesgo, pero el proyecto dura más y requiere mantener interfaces entre el sistema viejo y el nuevo durante la transición.
- *Paralelo:* se opera simultáneamente en el sistema viejo y el nuevo durante un período para verificar que los resultados coinciden. Costoso en esfuerzo pero muy seguro para los procesos críticos.

**Soporte intensivo post-go-live.** Las primeras 4-8 semanas son críticas. Los usuarios cometen más errores, surgen situaciones no previstas en las pruebas, y la productividad cae temporalmente. Un soporte presente y ágil en este período es fundamental para recuperar la confianza de los usuarios y estabilizar las operaciones.

**Resolución de incidencias.** Se establece un proceso para registrar, priorizar y resolver los problemas que aparecen en producción. Algunos se resuelven con ajustes de configuración, otros con capacitación adicional, otros requieren corrección de errores o parametrización adicional.

## Fase 7: Cierre del proyecto y transición a soporte

Una vez que el sistema está estabilizado y los usuarios operan con fluidez, el proyecto formal se cierra.

**Documentación final.** Manuales actualizados, documentación técnica de la configuración, registro de personalizaciones.

**Lecciones aprendidas.** Qué salió bien, qué salió mal, qué se haría diferente. Este aprendizaje es valioso para futuros proyectos de ampliación del ERP.

**Transición a soporte continuo.** El equipo del proyecto se disuelve y el sistema pasa a ser gestionado por el equipo de soporte habitual (TI interno y/o el proveedor del ERP).

**Optimización continua.** El go-live no es el fin del proyecto ERP: es el inicio de la operación. Las primeras semanas revelan oportunidades de mejora, funcionalidades que no se usaban bien, nuevas necesidades que van surgiendo. Un plan de optimización continua asegura que el valor del sistema aumenta con el tiempo en lugar de estancarse.

## Duración típica por fase

| Fase | Empresa mediana (6-12 meses total) |
|------|--------------------------------------|
| Planificación | 3-4 semanas |
| Análisis y diseño | 6-10 semanas |
| Configuración y desarrollo | 8-16 semanas |
| Pruebas | 4-6 semanas |
| Capacitación | 2-4 semanas |
| Go-live y estabilización | 4-8 semanas |

Estos tiempos son orientativos y varían significativamente según la complejidad del negocio, el alcance del proyecto y la disponibilidad del equipo cliente.
