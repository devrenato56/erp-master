# Errores comunes en implementaciones ERP y cómo evitarlos

## Introducción: aprender de los fracasos ajenos

Una de las ventajas de trabajar en el campo de los ERP hoy es que existe un extenso historial documentado de implementaciones exitosas y fallidas del que aprender. Los mismos errores se repiten con sorprendente consistencia en diferentes empresas, sectores y geografías. Conocerlos de antemano es una forma poderosa de no cometerlos.

Este capítulo describe los errores más frecuentes y costosos en implementaciones ERP, organizados por la fase del proyecto en que ocurren.

## Errores en la fase de decisión y selección

### Error 1: Seleccionar el ERP por razones equivocadas

El error más temprano posible: elegir el sistema incorrecto para la empresa. Las razones equivocadas más comunes son:

*El ERP que usa el competidor.* "Si ellos lo usan, para nosotros también funcionará." El sector es similar, pero los procesos específicos, el tamaño, la complejidad y el presupuesto pueden ser muy diferentes.

*El ERP recomendado por el área de TI sin consultar al negocio.* TI puede preferir una solución técnicamente elegante o que se integre bien con la infraestructura existente, pero si no cubre los procesos críticos del negocio, la elegancia técnica no tiene valor.

*El ERP más económico.* El costo de licencias es solo una fracción del costo total. Un ERP más barato que requiere tres veces más personalización puede terminar costando más que uno más caro con mejor ajuste.

*El ERP del último demo que impresionó.* Los demos de ERP son presentaciones comerciales cuidadosamente preparadas con escenarios ideales. No son evidencia de qué tan bien el sistema manejará los procesos reales de la empresa.

**Cómo evitarlo.** Hacer una selección estructurada: definir los requerimientos clave del negocio, invitar a varios proveedores a demostrar el sistema con escenarios reales de la empresa (no con demos genéricos), evaluar el costo total de propiedad a 5 años, y hablar con empresas similares que ya usen cada sistema candidato.

### Error 2: No evaluar al partner implementador con el mismo rigor que al software

El ERP y el equipo que lo implementa son igualmente críticos. Una buena herramienta en manos de un equipo implementador inexperto puede resultar en un proyecto fallido; un equipo excelente puede compensar ciertas limitaciones del software.

**Cómo evitarlo.** Pedir referencias verificables de implementaciones similares completadas. Conocer personalmente al equipo que trabajará en el proyecto (no solo al equipo de preventas que hizo la propuesta). Evaluar la rotación histórica de la consultora —los proyectos sufren enormemente cuando el consultor líder rota en medio del proyecto.

## Errores en la fase de planificación

### Error 3: Subestimar el esfuerzo del cliente

Un malentendido frecuente: "contratar la consultoría del ERP" se percibe como "delegar el proyecto al proveedor". En realidad, el éxito del proyecto depende críticamente del esfuerzo del equipo interno del cliente.

Los key users deben participar activamente durante meses. El sponsor debe tomar decisiones difíciles regularmente. El equipo de TI debe proveer infraestructura y soporte técnico. La gerencia debe comunicar, gestionar el cambio y resolver conflictos.

Una regla de práctica: por cada hora de trabajo del equipo consultor, el equipo interno debería dedicar al menos una hora equivalente. En proyectos de 10-12 meses, esto significa que los key users dedicados al proyecto están, en efecto, en el proyecto a tiempo completo.

**Cómo evitarlo.** Planificar explícitamente el tiempo del equipo interno en el cronograma del proyecto. Liberar a los key users de sus responsabilidades operativas habituales o redistribuir esas responsabilidades. No asumir que el equipo consultor puede avanzar solo.

### Error 4: Cronograma sin contingencia

Los cronogramas de proyectos ERP son notoriamente optimistas. Las razones son comprensibles: los proveedores no quieren asustar al cliente con plazos largos, el cliente quiere empezar a usar el sistema lo antes posible, y ambas partes subestiman la complejidad de lo desconocido.

**Cómo evitarlo.** Incluir explícitamente un buffer de contingencia del 20-30% en el cronograma. Identificar los caminos críticos del proyecto (las tareas que, si se atrasan, atrasan todo) y protegerlos con recursos adicionales. Establecer alertas tempranas: si una fase tarda el 80% del tiempo asignado y no está al 80% de avance, es una señal de alarma, no una razón para optimismo tardío.

## Errores en la fase de análisis y diseño

### Error 5: Sobre-personalizar el sistema

Este es quizás el error técnico más costoso de las implementaciones ERP. Ocurre cuando la empresa decide adaptar el ERP a sus procesos actuales en lugar de adaptar los procesos al estándar del ERP.

Las personalizaciones tienen costos que se extienden más allá del proyecto:
- **Costo de desarrollo inicial:** programar algo que el ERP estándar no hace.
- **Costo de pruebas:** cada personalización debe probarse extensivamente.
- **Costo de mantenimiento:** cada actualización del ERP puede romper las personalizaciones, que deben ser re-testeadas y posiblemente re-desarrolladas.
- **Costo de complejidad:** cuantas más personalizaciones, más difícil de entender y mantener el sistema.

El principio que los mejores consultores aplican: "si el ERP estándar puede hacer algo de manera diferente a como la empresa lo hace actualmente, la primera pregunta siempre debe ser '¿podemos adaptar el proceso de la empresa?', no '¿podemos personalizar el ERP?'"

**Cómo evitarlo.** Establecer un umbral alto para aprobar personalizaciones. Documentar el impacto de cada personalización propuesta (costo, complejidad, alternativas). Preferir la configuración (parametrización dentro de las opciones del estándar) sobre el desarrollo. Cuando la personalización es inevitable, minimizarla y documentarla exhaustivamente.

### Error 6: No documentar las decisiones de diseño

Durante la fase de diseño, se toman cientos de decisiones: cómo modelar la estructura organizativa, qué niveles de aprobación se configuran, cómo se clasifican los artículos, cuál es el método de valorización del inventario. Estas decisiones son fruto de horas de discusión entre consultores y usuarios. Si no se documentan, se pierden.

El problema aparece meses después, cuando alguien pregunta "¿por qué el sistema está configurado así?" y nadie lo recuerda. O cuando hay que retomar el proyecto tras una pausa y el conocimiento de las decisiones previas está solo en las cabezas de personas que quizás ya no están en el proyecto.

**Cómo evitarlo.** Mantener un registro de decisiones actualizado (Architecture Decision Record o simplemente un documento de "Decisiones del proyecto") donde cada decisión significativa quede documentada con fecha, opciones consideradas, y razón de la elección.

## Errores en la fase de pruebas

### Error 7: Pruebas insuficientes o superficiales

La presión de los plazos frecuentemente lleva a recortar el tiempo de pruebas. La lógica es comprensible pero peligrosa: si se está atrasado, se acortan las pruebas para llegar al go-live en fecha. El resultado: llegar al go-live con problemas no detectados que explotan en producción, donde son mucho más costosos y visibles.

**Cómo evitarlo.** Las pruebas deben incluir escenarios de borde y excepciones, no solo los flujos "felices". Los key users, no el equipo de consultoría, deben liderar las pruebas de aceptación —ellos conocen los casos especiales de su negocio. Las pruebas deben hacerse con datos lo más cercanos a los reales posible.

### Error 8: Go-live sin plan de rollback

El go-live es el momento de mayor riesgo del proyecto. Si algo sale gravemente mal —la migración de datos falla, el sistema tiene problemas de rendimiento críticos, un proceso clave no funciona— la empresa necesita poder volver a operar.

Sin un plan de rollback explícito, el equipo de proyecto no tiene opciones cuando surge una crisis en el go-live. El sistema antiguo ya fue cerrado, el nuevo no funciona, y la operación de la empresa está paralizada.

**Cómo evitarlo.** Definir explícitamente los criterios de "go/no-go" antes del día de go-live: qué problemas son aceptables y cuáles ameritan retrasar el lanzamiento. Documentar el proceso de rollback: cómo se reactiva el sistema antiguo, qué datos se necesitan. Tener el sistema antiguo disponible (en modo solo lectura, al menos) durante las primeras semanas de operación del nuevo ERP.

## Errores en la fase de capacitación

### Error 9: Capacitar demasiado temprano o con materiales incorrectos

Capacitar a los usuarios finales tres meses antes del go-live es tiempo perdido: habrán olvidado la mayor parte de lo aprendido para cuando necesiten usarlo. Capacitar con una versión del sistema que cambia significativamente antes del go-live genera confusión.

**Cómo evitarlo.** La capacitación a usuarios finales debe ocurrir 2-4 semanas antes del go-live, en el sistema final (o muy cercano al final), con datos de prueba representativos del negocio real. Además, preparar materiales de referencia rápida (guías de bolsillo, videos cortos) a los que los usuarios puedan recurrir durante los primeros días de operación real.

### Error 10: Olvidar el "por qué" en la capacitación

Los empleados que entienden por qué cambia un proceso adoptan el nuevo sistema con mucho más facilidad que los que solo aprenden mecánicamente cómo presionar botones.

"Antes registraban la factura del proveedor directamente; ahora deben esperar a que la recepción de mercadería esté registrada para hacer la verificación de factura. Esto existe porque el sistema realiza una triple conciliación (orden de compra + recepción + factura) que previene pagar facturas no correspondidas."

Esa explicación de 30 segundos aumenta significativamente la probabilidad de que el usuario entienda, acepte y aplique correctamente el proceso.

## Errores en el go-live y post-implementación

### Error 11: Soporte insuficiente en las primeras semanas

Las primeras semanas de operación real son cuando los usuarios más necesitan apoyo y cuando más problemas emergen. Cortar el soporte del equipo consultor inmediatamente después del go-live, o reducirlo drásticamente, es un error que genera frustración severa en los usuarios y erosiona la confianza en el nuevo sistema.

**Cómo evitarlo.** Planificar y presupuestar soporte intensivo durante las primeras 4-8 semanas post-go-live. Los consultores clave deben estar disponibles (presencialmente o con tiempo de respuesta muy rápido) durante este período. Los key users entrenados durante el proyecto deben asumir el rol de soporte de primera línea para sus áreas.

### Error 12: No medir los beneficios

Muchas implementaciones ERP terminan el proyecto sin establecer métricas para evaluar si los beneficios prometidos se están materializando. El resultado: no se sabe si el proyecto valió la pena, y no hay información para tomar decisiones sobre mejoras o expansiones futuras.

**Cómo evitarlo.** Definir KPIs de éxito antes del go-live, medirlos en el estado actual (baseline), y volver a medirlos a los 3, 6 y 12 meses post-implementación. Ejemplos: tiempo de cierre contable mensual, tiempo promedio de ciclo de pedido, exactitud de inventario, número de errores en facturas. Estos números cuentan la historia real del retorno sobre la inversión.

## El patrón subyacente

Una revisión de todos estos errores revela un patrón: la mayoría no son errores técnicos sino errores de gestión, comunicación y expectativas. El ERP como tecnología rara vez falla; los proyectos ERP fallan cuando las personas —en la empresa cliente o en el equipo implementador— no hacen bien su parte.

El profesional de ERP que entiende estos errores y sabe cómo prevenirlos tiene una ventaja enorme sobre el que solo conoce la funcionalidad técnica del sistema. Las empresas necesitan ambas habilidades, pero la escasez de la segunda hace que sea la más valiosa.
