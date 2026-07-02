# Módulos típicos de un ERP

## La arquitectura modular del ERP

Un ERP no es un programa monolítico que hace todo de una vez. Está construido como un conjunto de módulos funcionales que representan las distintas áreas de una empresa. Cada módulo gestiona un dominio específico (finanzas, compras, inventario, producción, etc.) pero comparte la misma base de datos central con los demás. Esta arquitectura tiene dos ventajas clave: primero, permite implementar el ERP por etapas, activando módulos según las necesidades y prioridades de la empresa; segundo, garantiza que los datos fluyan automáticamente entre módulos sin intervención manual.

A continuación se describen los módulos más comunes en un ERP estándar, su función, y cómo interactúan entre sí.

## Módulo de Finanzas y Contabilidad (FI)

Es el núcleo del ERP. Registra todas las transacciones económicas de la empresa y produce los estados financieros (balance general, estado de resultados, flujo de caja).

**Contabilidad General (GL - General Ledger).** Registra cada transacción económica como asientos contables dobles (débito y crédito). Cada operación del negocio —una compra, una venta, una depreciación— genera un asiento automático en el GL.

**Cuentas por Pagar (AP - Accounts Payable).** Gestiona las obligaciones de la empresa con sus proveedores: facturas de compra recibidas, aprobación del pago, programación de pagos, conciliación bancaria.

**Cuentas por Cobrar (AR - Accounts Receivable).** Gestiona los derechos de la empresa sobre sus clientes: facturas emitidas, seguimiento de cobros, gestión de vencimientos, conciliación de pagos recibidos.

**Activos Fijos.** Control del ciclo de vida de los bienes de capital de la empresa: compra, depreciación periódica, revaluación y baja. Calcula automáticamente la depreciación según los métodos definidos (línea recta, decreciente, etc.).

**Contabilidad de Costos (CO - Controlling).** Va más allá del registro contable: asigna costos a centros de costo, órdenes de producción, proyectos o líneas de producto. Permite saber cuánto cuesta producir una unidad específica, rentabilidad por línea de negocio, o desviaciones respecto al presupuesto.

**Integración clave:** cada movimiento en módulos operativos (compras, ventas, producción) genera automáticamente un asiento contable en el módulo de finanzas, eliminando la necesidad de re-digitar información.

## Módulo de Compras y Gestión de Proveedores (MM - Materials Management / Procurement)

Gestiona el ciclo completo de abastecimiento: desde la necesidad de compra hasta el pago al proveedor.

**Flujo estándar de compras:**
1. Solicitud de compra (generada manualmente o automáticamente por el módulo de inventario/planificación).
2. Solicitud de cotización a proveedores.
3. Comparación de ofertas y selección de proveedor.
4. Orden de compra aprobada y enviada al proveedor.
5. Recepción de mercadería (con actualización automática del inventario).
6. Verificación de factura contra orden de compra y recepción (proceso de triple conciliación o 3-way match).
7. Aprobación y pago (integrado con Cuentas por Pagar).

**Gestión de proveedores.** Incluye el maestro de proveedores (datos fiscales, condiciones de pago, historial de compras), evaluación de desempeño y gestión de contratos marco.

## Módulo de Inventario y Almacenes (WM - Warehouse Management)

Controla la ubicación, movimiento y cantidad de todos los artículos físicos de la empresa.

**Control de stock.** Mantiene la cantidad disponible de cada artículo en cada ubicación del almacén, actualizada en tiempo real con cada entrada (compra, producción) y salida (venta, consumo en producción).

**Gestión de ubicaciones.** En almacenes complejos, el módulo controla la ubicación exacta de cada artículo (pasillo, estante, posición), optimizando el uso del espacio y reduciendo los tiempos de búsqueda.

**Valorización de inventario.** Calcula el valor monetario del stock según distintos métodos: PEPS (primero en entrar, primero en salir), UEPS, costo promedio ponderado. Esta valorización se integra con la contabilidad automáticamente.

**Gestión de lotes y números de serie.** Fundamental para industrias reguladas (farmacéutica, alimentos, electrónica): rastrea cada unidad o lote desde su ingreso al almacén hasta su entrega al cliente, permitiendo trazabilidad completa.

**Integración clave:** cuando ventas confirma un pedido, el inventario verifica disponibilidad y reserva el stock. Cuando producción consume materiales, el inventario los descuenta. Cuando compras recibe mercadería, el inventario la incrementa y contabilidad registra el activo.

## Módulo de Ventas y Distribución (SD - Sales and Distribution)

Gestiona el ciclo de venta desde la consulta del cliente hasta la entrega y cobro.

**Flujo estándar de ventas:**
1. Consulta de precio y disponibilidad.
2. Cotización al cliente.
3. Pedido de venta confirmado.
4. Verificación de crédito del cliente.
5. Preparación y despacho del pedido (integrado con almacenes).
6. Entrega y generación de guía de remisión/albarán.
7. Facturación (integrado con Cuentas por Cobrar).
8. Cobro y cierre del ciclo.

**Gestión de precios.** Permite estructuras de precios complejas: precios por cliente, por volumen, descuentos por campaña, precios diferenciados por canal de venta o zona geográfica.

**Gestión de clientes.** Maestro de clientes con datos fiscales, condiciones de pago, límite de crédito, historial de compras y clasificación por segmento.

**Integración clave:** al confirmar un pedido, el módulo SD verifica el inventario disponible, el crédito del cliente y genera la orden de entrega. Al facturar, genera automáticamente el asiento de ventas en contabilidad y la cuenta por cobrar.

## Módulo de Producción / Manufactura (PP - Production Planning)

Específico para empresas que fabrican productos, este módulo planifica y controla el proceso productivo.

**Lista de materiales (BOM - Bill of Materials).** Define los componentes necesarios para fabricar cada producto terminado. Si cambias la BOM, el sistema recalcula automáticamente los requerimientos de materiales para todas las órdenes de producción pendientes.

**Rutas de producción.** Define la secuencia de operaciones necesarias para fabricar un producto, los centros de trabajo involucrados y los tiempos estándar de cada operación.

**Órdenes de producción.** Documentos que autorizan y registran la fabricación de un lote. Al confirmarse una orden, el sistema descuenta los materiales consumidos del inventario y registra el producto terminado.

**MRP (Material Requirements Planning).** Calcula automáticamente qué materiales se necesitan para cumplir el plan de producción, cuándo y en qué cantidad. Genera automáticamente solicitudes de compra o propuestas de producción para cubrir los requerimientos.

**Integración clave:** producción recibe la demanda de ventas, planifica los materiales a través del MRP, consume inventario al ejecutar órdenes, y envía los productos terminados al almacén. Los costos de producción fluyen automáticamente a contabilidad de costos.

## Módulo de Recursos Humanos (HCM - Human Capital Management)

Gestiona el ciclo de vida del empleado dentro de la organización.

**Administración de personal.** Datos maestros del empleado: información personal, posición, historial laboral, documentos, evaluaciones de desempeño.

**Gestión del tiempo.** Registro de asistencia, horas trabajadas, horas extras, ausencias y vacaciones. En sistemas avanzados, integrado con lectores biométricos o sistemas de control de acceso.

**Nómina.** Cálculo automático del salario de cada empleado según su categoría, horas trabajadas, bonificaciones, deducciones y las normas legales vigentes (impuesto a la renta, aportes sociales). Genera los comprobantes de pago y los asientos contables correspondientes.

**Gestión de competencias y formación.** Registro de habilidades, certificaciones y planes de capacitación. En ERP avanzados, puede planificar la formación necesaria según los gaps de competencias del equipo.

**Integración clave:** la nómina calculada en RRHH genera automáticamente asientos de gastos de personal en contabilidad. Las horas reportadas por producción pueden integrarse con el módulo de tiempo para calcular costos laborales por orden de producción.

## Módulo de Proyectos

Usado por empresas de servicios, construcción, consultoría y cualquier organización que trabaje por proyectos en lugar de por procesos repetitivos.

Gestiona presupuesto del proyecto, asignación de recursos humanos y materiales, registro de costos reales vs. presupuestados, facturación por avance o hitos, y rentabilidad por proyecto.

**Integración clave:** los costos de compras, nómina y equipos asignados al proyecto se consolidan automáticamente en el módulo de proyectos, dando visibilidad en tiempo real del estado financiero de cada proyecto.

## Módulo de CRM (Customer Relationship Management)

Aunque originalmente era un sistema separado del ERP, muchos ERP modernos integran funcionalidades de CRM: gestión del embudo de ventas, seguimiento de oportunidades comerciales, gestión de casos de soporte al cliente, y análisis de comportamiento de clientes.

La integración ERP-CRM es especialmente valiosa porque permite que el equipo de ventas vea en tiempo real el stock disponible, el crédito del cliente y el historial de facturación sin salir del sistema.

## Módulo de Inteligencia de Negocios (BI / Reportes)

No es un módulo operativo sino analítico. Consolida datos de todos los módulos en dashboards e informes ejecutivos: ventas por período, rentabilidad por línea de producto, rotación de inventario, días de cuentas por cobrar, eficiencia productiva.

Los ERP modernos integran capacidades de BI en tiempo real, eliminando la necesidad de exportar datos a Excel para analizarlos.

## Cómo se relacionan los módulos entre sí: el ejemplo de una venta

Para ilustrar la integración, siguamos el flujo de una venta sencilla a través de los módulos:

1. **Ventas (SD)** recibe un pedido de un cliente por 100 unidades del producto X.
2. **Inventario (MM/WM)** verifica que hay 150 unidades disponibles y reserva 100.
3. **Finanzas (FI)** verifica que el cliente tiene línea de crédito disponible.
4. **Almacenes (WM)** prepara el despacho y registra la salida de las 100 unidades.
5. **Inventario** descuenta las 100 unidades del stock disponible.
6. **Ventas (SD)** genera la factura por el importe acordado.
7. **Finanzas (FI / AR)** registra la cuenta por cobrar y el asiento de venta.
8. **Contabilidad de Costos (CO)** registra el costo de los bienes vendidos (CMV).

Todo este flujo ocurre de forma automática y en tiempo real, sin que ningún operador tenga que re-digitar información en un sistema diferente. Esta es la esencia del valor de un ERP.
