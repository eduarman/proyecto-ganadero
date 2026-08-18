# Requirements — Sanidad

## User Stories

### US-1: Catálogo de productos y protocolos sanitarios

Como usuario, quiero mantener un catálogo de vacunas/medicamentos y protocolos aplicables.

**Criterios de aceptación**

1. EL SISTEMA DEBE permitir registrar productos sanitarios (vacunas, antiparasitarios, medicamentos) con nombre, tipo, y dosis recomendada.
2. EL SISTEMA DEBE permitir definir protocolos (calendarios tipo: ej. "vacuna X cada 6 meses a partir de los 3 meses de edad") aplicables automáticamente a los animales que cumplan el criterio.

### US-2: Registro de vacunación/tratamiento

Como usuario operativo, quiero registrar cada aplicación sanitaria.

**Criterios de aceptación**

1. CUANDO se registra una aplicación, EL SISTEMA DEBE requerir animal (o lote/potrero para aplicación masiva), producto, fecha, dosis aplicada, y DEBE permitir observaciones y responsable (veterinario/operario).
2. EL SISTEMA DEBE permitir aplicación masiva a un lote/potrero completo en un solo registro (similar a UX de producción).
3. CUANDO el producto tiene un intervalo de refuerzo definido, EL SISTEMA DEBE calcular automáticamente la próxima fecha de aplicación esperada.

### US-3: Diagnóstico y enfermedad

Como usuario, quiero registrar diagnósticos de enfermedad de un animal.

**Criterios de aceptación**

1. CUANDO se registra un diagnóstico, EL SISTEMA DEBE requerir animal, fecha, enfermedad/condición (texto libre o catálogo) y gravedad, y DEBE permitir vincular el tratamiento aplicado.
2. EL SISTEMA DEBE permitir marcar un animal en cuarentena, con fecha de inicio y fin estimada, reflejado visualmente en el listado de ganado y en la ficha del animal.

### US-4: Alertas sanitarias

Como usuario, quiero recibir alertas de vencimientos y refuerzos pendientes.

**Criterios de aceptación**

1. EL SISTEMA DEBE generar alertas para: refuerzos de vacunación vencidos o próximos a vencer (configurable, ej. 7 días antes), y protocolos programados no aplicados a tiempo.
2. LAS ALERTAS DEBEN ser visibles en el dashboard y en un listado dedicado dentro del módulo de sanidad.

### US-5: Historial sanitario del animal

Como usuario, quiero ver el historial sanitario completo de un animal.

**Criterios de aceptación**

1. LA FICHA DEL ANIMAL DEBE mostrar, en su tab de Sanidad, todas las aplicaciones, diagnósticos y periodos de cuarentena en orden cronológico.
2. UN VETERINARIO_EXTERNO invitado a un negocio DEBE poder ver y registrar en este módulo para los animales de ese negocio, sin acceso a los demás módulos operativos (ver `security-roles.md`).
