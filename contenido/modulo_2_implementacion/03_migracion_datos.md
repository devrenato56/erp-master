# Migración de datos en proyectos ERP

## Por qué la migración de datos es crítica

En el contexto de una implementación ERP, "migración de datos" significa trasladar los datos existentes de los sistemas anteriores —hojas de cálculo, sistemas legacy, bases de datos de aplicaciones previas— al nuevo sistema ERP. Suena técnico y secundario. En realidad, es una de las actividades más complejas, costosas y riesgosas de todo el proyecto.

El motivo es simple: el ERP funciona con los datos que contiene. Si el maestro de materiales tiene artículos duplicados, el sistema generará órdenes de compra duplicadas. Si el stock inicial está mal valorizado, los estados financieros del primer mes serán incorrectos. Si los datos de clientes tienen errores en los RFC o CIFs fiscales, las facturas electrónicas serán rechazadas. Los errores de datos se amplifican con la velocidad y automatización que proporciona el ERP.

Un estudio de IBM señaló que los problemas de migración de datos son responsables de hasta el 25% de los fracasos totales en proyectos de ERP. No es exagerado decir que una migración de datos exitosa es condición necesaria (aunque no suficiente) para que el proyecto tenga éxito.

## Tipos de datos que se migran

No todos los datos se migran de la misma manera ni con la misma prioridad. Se distinguen dos categorías principales:

**Datos maestros (Master Data).** Son los datos de referencia que describen las entidades del negocio: quiénes son los clientes, qué artículos se venden, quiénes son los proveedores, cuál es el plan de cuentas. Son relativamente estables (no cambian con cada transacción) y son la base sobre la que funcionan todos los procesos del ERP. Si los datos maestros están bien, el sistema tiene bases sólidas; si están mal, cada proceso construido sobre ellos heredará los errores.

Ejemplos de datos maestros típicos:
- Maestro de materiales/artículos: código, descripción, unidad de medida, precio, categoría.
- Maestro de proveedores: datos fiscales, datos de contacto, condiciones de pago, cuenta bancaria.
- Maestro de clientes: datos fiscales, límite de crédito, condiciones de pago, categoría comercial.
- Plan de cuentas y centros de costo.
- Estructuras organizativas (plantas, almacenes, centros de costo).

**Datos transaccionales de apertura (Open Items).** Son las transacciones en curso en el momento del corte: facturas pendientes de cobro (cuentas por cobrar abiertas), facturas pendientes de pago (cuentas por pagar abiertas), órdenes de compra en curso, órdenes de venta sin completar, stock disponible en almacenes.

Estos datos son críticos porque representan compromisos financieros y operativos reales que el nuevo sistema debe honrar desde el primer día. Un cliente que tiene una factura pendiente en el sistema antiguo espera que la empresa la gestione correctamente en el nuevo sistema.

**Datos históricos.** Son las transacciones pasadas ya completadas. Decisiones sobre qué histórico migrar varían: algunos proyectos migran 2-3 años de historia transaccional para mantener reportes históricos; otros prefieren dejar el histórico en el sistema antiguo (en modo consulta) y empezar el ERP con saldo cero más los ítems abiertos. La decisión tiene implicancias de costo (más histórico = más trabajo de migración) y de utilidad (¿realmente se consultará ese histórico en el nuevo sistema?).

## Las etapas de la migración de datos

### Etapa 1: Inventario de datos fuente

Antes de mover cualquier dato, se documenta el estado actual: ¿qué datos existen, en qué sistemas, en qué formato, con qué calidad? Este inventario incluye:
- Los sistemas fuente (aplicación de contabilidad, sistema de facturación, hojas Excel, base de datos del sistema legacy).
- Los datos disponibles en cada sistema y su estructura (tablas, campos, tipos de datos).
- El volumen de datos (número de registros por entidad).
- Una primera evaluación de la calidad: ¿hay duplicados? ¿campos en blanco? ¿datos en formatos inconsistentes?

### Etapa 2: Diseño del mapeo (Mapping)

El "mapeo" es la definición de cómo cada dato del sistema fuente corresponde a un campo del sistema destino (el ERP). Esta tarea parece mecánica pero esconde complejidad considerable:

- El campo "código de cliente" en el sistema antiguo puede tener formato alfanumérico de hasta 10 caracteres; el ERP puede requerir solo numérico de 8 dígitos. ¿Cómo se convierte?
- El sistema antiguo puede tener un campo "condición de pago" con valores libres en texto ("30 días", "a 30 días", "treinta días"); el ERP requiere códigos específicos ("Z030"). ¿Cómo se estandariza?
- Puede haber información que existe en el sistema antiguo pero no tiene campo equivalente en el ERP estándar, o viceversa.

El documento de mapeo, validado tanto por el equipo de TI como por los usuarios funcionales, es el contrato que define exactamente cómo se transformarán los datos.

### Etapa 3: Extracción y limpieza

Con el mapeo definido, se extraen los datos de los sistemas fuente y se ejecutan las transformaciones necesarias. Frecuentemente, los datos extraídos se trabajan en herramientas intermedias (Excel, Python, herramientas ETL como Talend o SSIS) antes de cargarlos al ERP.

La limpieza de datos es la actividad que más sorprende por su complejidad:

**Eliminación de duplicados.** Es común encontrar el mismo proveedor registrado tres veces con variaciones en el nombre o el código. ¿Cuál es el registro correcto? ¿Se fusionan o se eliminan dos? Esta decisión requiere revisión manual.

**Completado de campos obligatorios.** El ERP puede requerir un campo (por ejemplo, el grupo de cuentas de un proveedor) que el sistema antiguo no tenía. Alguien debe asignar ese valor para cada registro.

**Estandarización de formatos.** Fechas en distintos formatos, nombres con y sin tildes, códigos fiscales con y sin guiones. Todo debe estandarizarse para que el ERP los acepte.

**Validación de consistencia.** Un artículo no puede tener precio de venta menor que el costo. Un cliente no puede tener fecha de nacimiento en el futuro. Un proveedor no puede tener cuenta bancaria en formato incorrecto.

Esta etapa revela invariablemente que los datos están en peor estado del que la empresa creía. Es importante planificar tiempo y recursos para este trabajo, que a menudo se extiende más de lo esperado.

### Etapa 4: Cargas de prueba

Antes del go-live, se realizan varias cargas de prueba en un ambiente de QA o preproducción del ERP. El objetivo es verificar que:
- Los programas de carga funcionan correctamente (no hay errores técnicos).
- Los datos transformados tienen el aspecto correcto en el sistema (los usuarios los reconocen).
- Los datos migrados pasan las validaciones del ERP.
- Los saldos y cantidades coinciden con los sistemas fuente (conciliación).

Las primeras cargas de prueba siempre revelan problemas. Es normal: para eso se hace la prueba. El ciclo "cargar → detectar errores → corregir datos → cargar nuevamente" se repite múltiples veces hasta que la carga de prueba sale limpia.

### Etapa 5: Reconciliación

Una vez que una carga de prueba sale limpia, se realizan pruebas de reconciliación: comparar los totales del sistema fuente con los totales del sistema destino. Si el sistema antiguo dice que hay 1.247 artículos en el maestro de materiales, el ERP también debe mostrar 1.247. Si el saldo de cuentas por cobrar en el sistema antiguo es 487.500 USD, el ERP también debe mostrar 487.500 USD.

Las diferencias de reconciliación son señales de alerta que deben investigarse y resolverse antes del go-live.

### Etapa 6: Carga final (cutover)

En la semana del go-live, se ejecuta la carga final de datos (el "cutover"). Esta carga usa los datos al corte, es decir, actualizados al último momento antes de que el sistema antiguo se cierre. El timing es crítico:
- Se cierra el sistema antiguo (o se congela la entrada de datos).
- Se extrae el saldo final.
- Se carga en el ERP.
- Se valida la reconciliación.
- El ERP abre a los usuarios.

Este proceso puede durar desde horas hasta un fin de semana completo, dependiendo del volumen de datos y la complejidad del sistema. Muchas empresas hacen el cutover durante un fin de semana o en un período de baja actividad.

## Errores comunes en la migración de datos

**Empezar demasiado tarde.** La migración de datos debe comenzar en la fase de diseño, no al final. Los problemas de calidad de datos descubiertos tarde generan retrasos en el go-live.

**Subestimar el volumen de limpieza necesario.** "Nuestros datos están bastante bien" es una frase que casi siempre resulta optimista. Planificar 30-40% más tiempo del estimado inicial para la limpieza es prudente.

**No involucrar a los usuarios en la validación.** Los equipos técnicos pueden verificar que los datos tienen el formato correcto, pero solo los usuarios funcionales pueden verificar que los datos tienen sentido desde el negocio. ¿Reconocen a sus clientes? ¿El stock migrado coincide con lo que saben que hay físicamente?

**Migrar datos innecesarios.** La tentación de migrar todo el histórico disponible puede convertirse en una carga inmanejable. Priorizar qué datos son realmente necesarios en el nuevo sistema y dejar el resto accesible en el sistema antiguo (en modo consulta) es frecuentemente la decisión más práctica.

**No tener plan de rollback.** ¿Qué pasa si la carga final falla? ¿Puede la empresa volver a operar en el sistema antiguo? Tener un plan de contingencia claro es parte de una migración responsable.

## Herramientas comunes para migración de datos ERP

**Herramientas nativas del ERP.** SAP tiene LSMW (Legacy System Migration Workbench) y BAPI; SAP S/4HANA tiene la suite de migración S/4HANA. Oracle tiene Data Load Templates. Estas herramientas están diseñadas específicamente para el ERP y validan los datos antes de cargarlos.

**Herramientas ETL (Extract, Transform, Load).** Talend, SSIS (SQL Server Integration Services), Informatica son herramientas profesionales para la transformación de grandes volúmenes de datos. Más potentes pero requieren más expertise técnico.

**Excel / Python.** Para volúmenes medianos, las transformaciones en Excel con macros o en Python con pandas son perfectamente válidas. Python es especialmente útil para limpieza de datos con reglas complejas (deduplicación fuzzy, validaciones cruzadas).

**Data Migration Cockpit (SAP S/4HANA).** La herramienta más moderna de SAP para migración guiada, diseñada para simplificar el proceso en implementaciones cloud.

## La migración de datos como proyecto dentro del proyecto

Por su complejidad y duración, la migración de datos debe gestionarse como un sub-proyecto con su propio líder, cronograma, recursos y criterios de aceptación. Asignar la migración de datos como "una tarea más" del equipo técnico sin recursos dedicados es una receta para problemas.

Las organizaciones que tratan la migración de datos con el rigor que merece —planificándola temprano, asignando resources, iterando múltiples cargas de prueba, y validando con usuarios— consistentemente reportan transiciones más suaves al nuevo ERP.
