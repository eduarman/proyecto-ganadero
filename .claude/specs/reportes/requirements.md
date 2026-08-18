# Requirements — Reportes

## User Stories

### US-1: Reportes por módulo

Como usuario, quiero generar reportes específicos de cada módulo operativo.

**Criterios de aceptación**

1. EL SISTEMA DEBE ofrecer reportes predefinidos por módulo: inventario de ganado (por categoría/potrero/estado), natalidad/mortalidad, producción (leche/peso) por periodo, costos de alimentación, cumplimiento sanitario (vacunación al día vs. atrasada), ocupación de potreros.
2. CADA REPORTE DEBE permitir filtrar por rango de fechas y, cuando aplique, por potrero o lote.
3. LA VISIBILIDAD de cada reporte DEBE respetar la matriz de permisos por rol (ej. `OPERARIO` no accede a reportes, ver `security-roles.md`).

### US-2: Reportes cruzados

Como `ADMIN_NEGOCIO`, quiero cruzar información entre módulos para decisiones de negocio.

**Criterios de aceptación**

1. EL SISTEMA DEBE ofrecer al menos un reporte cruzado de costo de alimentación vs. producción (leche o ganancia de peso) por periodo, para estimar eficiencia/rentabilidad relativa.
2. EL SISTEMA DEBE permitir comparar indicadores entre potreros o lotes en un mismo reporte.

### US-3: Exportación

Como usuario, quiero exportar reportes para compartirlos o archivarlos.

**Criterios de aceptación**

1. CUALQUIER REPORTE DEBE poder exportarse en PDF y en Excel.
2. LA EXPORTACIÓN DEBE generarse en el backend (no en el navegador) para garantizar formato consistente entre web y móvil.
3. CUANDO el reporte es de generación pesada (rango de fechas amplio, hato grande), EL SISTEMA DEBE generarlo de forma asíncrona (job en cola) y notificar/permitir descarga cuando esté listo, en vez de bloquear la request.

### US-4: Multi-negocio (Plan 3)

Como `ADMIN_NEGOCIO` de Plan 3, quiero ver reportes consolidados de todos mis negocios o filtrar por uno específico.

**Criterios de aceptación**

1. EL SISTEMA DEBE ofrecer, solo en Plan 3, la opción de generar un reporte consolidado que agregue datos de todos los negocios activos de la cuenta, dejando explícito el desglose por negocio dentro del mismo reporte (nunca mezclando cifras sin atribución).
2. EL REPORTE consolidado NUNCA DEBE exponerse a un usuario que no sea `ADMIN_NEGOCIO` de la cuenta completa (un `MAYORDOMO` u `OPERARIO` de un negocio puntual solo ve reportes de ese negocio).
