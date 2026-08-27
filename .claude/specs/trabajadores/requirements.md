# Requirements — Trabajadores

Referencia: `.claude/steering/security-roles.md`, `.claude/steering/product.md`.

## Decisiones de alcance (v1)

- **"Finca" = `Negocio` (tenant) actual.** El resto de la documentación ya usa "finca" como sinónimo informal de negocio (ver `product.md`). Este módulo no introduce una entidad `Finca` nueva ni subdivide un negocio en varias propiedades físicas — todo trabajador, asignación, actividad, asistencia y pago vive dentro de un único `tenant_id`, igual que el resto de los módulos. Un mismo trabajador que opera en más de un negocio (Plan 3, distintas localidades bajo una misma cuenta) queda **fuera de alcance de v1**: cada negocio lleva su propia nómina de forma independiente. Los reportes "por finca" (US-11) se satisfacen con el hecho de que cada negocio ya ve solo sus propios datos — no hay agregación cruzada de negocios en v1 (igual que `dashboard` US-4.2).
- **Multi-moneda (USD/VES) queda acotado a este módulo.** Ningún otro módulo (`alimentacion`, `reportes`, etc.) maneja moneda hoy; no se generaliza un primitivo de moneda a nivel plataforma en esta ronda.
- **`Trabajador` no es un `Usuario` del sistema.** No inicia sesión, no tiene rol (`RolUsuario`), no aparece en `usuarios-roles`. Es un registro puramente administrativo/de RRHH gestionado por quien sí tiene acceso al sistema (`ADMIN_NEGOCIO`/`MAYORDOMO`). Si más adelante un trabajador necesita login (ej. un mayordomo que también es trabajador registrado), la vinculación `Trabajador ↔ Usuario` queda fuera de alcance de v1.

## Permisos (propuesta — confirmar antes de implementar)

Dado que el módulo maneja datos sensibles (nómina, adelantos, préstamos), se propone una matriz más restrictiva que otros módulos operativos:

| Acción | `ADMIN_NEGOCIO` | `MAYORDOMO` | `OPERARIO` | `VETERINARIO_EXTERNO` |
|---|---|---|---|---|
| Trabajadores, cargos, actividades, asignaciones | RW | RW | - | - |
| Asistencia y registro de actividades realizadas | RW | RW | - | - |
| Pagos, adelantos, préstamos (ver) | RW | R | - | - |
| Pagos, adelantos, préstamos (crear/confirmar) | RW | - | - | - |
| Reportes y dashboard del módulo | RW | R | - | - |

`OPERARIO` y `VETERINARIO_EXTERNO` no tienen acceso al módulo — no se menciona en el pedido original y maneja nómina, que excede su alcance en el resto del sistema (ver matriz general en `security-roles.md`). `MAYORDOMO` puede operar el día a día (asistencia, actividades, asignaciones) pero no autoriza pagos ni entrega adelantos/préstamos por su cuenta — esa decisión financiera queda en `ADMIN_NEGOCIO`, igual criterio que "no permitir pagos a trabajadores inactivos sin autorización" (US-7.4).

## User Stories

### US-1: Listado y gestión de trabajadores

Como `ADMIN_NEGOCIO`/`MAYORDOMO`, quiero ver y administrar el listado de trabajadores de mi negocio.

**Criterios de aceptación**

1. EL LISTADO DEBE mostrar, por trabajador: nombre completo, documento, cargo, tipo de contratación, fecha de ingreso, teléfono y estado (`ACTIVO`/`INACTIVO`).
2. EL SISTEMA DEBE permitir buscar por nombre/documento, filtrar por cargo/estado/tipo de contratación, y ordenar el listado.
3. CUANDO se crea un trabajador, EL SISTEMA DEBE requerir: nombres, apellidos, documento de identidad (único por negocio), cargo, fecha de ingreso, tipo de contratación, modalidad de pago y salario/valor del jornal. Fecha de nacimiento, teléfono, email, dirección y contacto de emergencia son opcionales.
4. EL TIPO DE CONTRATACIÓN DEBE ser uno de: `MENSUAL`, `JORNAL`, `POR_ACTIVIDAD`, `TEMPORAL`, `OTRO`.
5. LA MODALIDAD DE PAGO DEBE ser una de: `MENSUAL`, `SEMANAL`, `QUINCENAL`, `DIARIO`, `POR_ACTIVIDAD`.
6. EL SISTEMA DEBE permitir editar los datos del trabajador y conservar un registro de los cambios relevantes (ver US-13, historial).
7. INACTIVAR un trabajador NO DEBE eliminar sus registros históricos (asistencia, actividades, pagos, adelantos, préstamos) — solo cambia su estado y lo excluye de los selectores operativos de otros módulos que lo permitan (patrón ya usado en `ganado`/`alimentacion` para inactivos).

### US-2: Ficha del trabajador

Como `ADMIN_NEGOCIO`/`MAYORDOMO`, quiero ver el historial completo de un trabajador en un solo lugar.

**Criterios de aceptación**

1. LA FICHA DEBE mostrar en la cabecera: nombre, cargo, estado, fecha de ingreso y antigüedad calculada (no almacenada).
2. LA FICHA DEBE mostrar indicadores agregados: jornadas realizadas, horas trabajadas, total pagado, adelantos pendientes y préstamos pendientes (todos calculados en el período visible, no precalculados/duplicados en la tabla de trabajadores).
3. LA FICHA DEBE organizarse en pestañas: Información general, Asignaciones, Asistencia, Actividades, Pagos, Adelantos, Préstamos, Historial — cada una consultando el endpoint del módulo correspondiente (mismo criterio de consolidación ya usado en la ficha de `ganado`, spec `ganado` US-3).

### US-3: Catálogo de cargos y actividades

Como `ADMIN_NEGOCIO`/`MAYORDOMO`, quiero un catálogo reutilizable de cargos y de tipos de actividad.

**Criterios de aceptación**

1. EL SISTEMA DEBE traer un catálogo inicial de actividades ganaderas comunes (alimentación, ordeño, limpieza, vacunación, desparasitación, manejo de ganado, pesaje, mantenimiento, manejo de potreros, reparación, vigilancia, otras) sembrado por negocio o por defecto, y DEBE permitir crear actividades personalizadas.
2. LOS CARGOS DEBEN ser un catálogo libre por negocio (sin lista predefinida), con nombre y estado (activo/inactivo), mismo patrón que otros catálogos del sistema (`InsumoAlimentacion`, `ProductoSanitario`): no se elimina un cargo en uso, se inactiva.
3. UN CARGO O ACTIVIDAD inactivado NO DEBE aparecer en los selectores de alta nueva, pero DEBE seguir mostrándose correctamente en los registros históricos que ya lo usan.

### US-4: Asignaciones

Como `ADMIN_NEGOCIO`/`MAYORDOMO`, quiero asignar trabajadores a un cargo y, opcionalmente, a un potrero de responsabilidad, con vigencia en el tiempo.

**Criterios de aceptación**

1. CUANDO se crea una asignación, EL SISTEMA DEBE registrar: trabajador, cargo y/o potrero, fecha de inicio, fecha de fin (opcional — abierta si no se especifica), estado y observaciones.
2. EL SISTEMA DEBE conservar el historial completo de asignaciones de un trabajador (no se sobrescribe la anterior al crear una nueva — se cierra con fecha de fin y se abre una nueva).
3. LA FICHA DEL TRABAJADOR (US-2) DEBE mostrar la asignación vigente de forma destacada y el historial completo debajo.

### US-5: Registro de actividades realizadas

Como `ADMIN_NEGOCIO`/`MAYORDOMO`, quiero registrar qué actividad se realizó, cuándo, quién participó y sobre qué animales, para tener trazabilidad de la mano de obra.

**Criterios de aceptación**

1. CUANDO se registra una actividad realizada, EL SISTEMA DEBE requerir: tipo de actividad (del catálogo, US-3) y fecha; y DEBE permitir opcionalmente: uno o varios trabajadores, potrero, hora de inicio/fin, cantidad de animales, animales específicos (referenciando el módulo `ganado`) y observaciones.
2. UNA ACTIVIDAD DEBE poder asociarse a uno o varios trabajadores a la vez (ej. una vacunación hecha por dos personas el mismo día se registra una sola vez con ambos trabajadores).
3. CUANDO la actividad referencia animales específicos, EL SISTEMA DEBE validar que pertenezcan al negocio activo (mismo criterio que `sanidad`/`alimentacion` al referenciar `animal_ids`).
4. LAS ACTIVIDADES REALIZADAS de un trabajador DEBEN alimentar tanto su ficha (US-2) como el cálculo de liquidaciones "por actividad" (US-7).

### US-6: Asistencia y jornadas

Como `ADMIN_NEGOCIO`/`MAYORDOMO`, quiero registrar la asistencia diaria y las horas/jornales trabajados.

**Criterios de aceptación**

1. CUANDO se registra asistencia, EL SISTEMA DEBE requerir: trabajador, fecha y estado (`PRESENTE`, `AUSENTE`, `PERMISO`, `VACACIONES`, `FALTA_JUSTIFICADA`, `FALTA_INJUSTIFICADA`); y DEBE permitir opcionalmente hora de entrada/salida, tipo de jornada, jornal realizado (para contratación por jornal) y observaciones.
2. EL SISTEMA DEBE calcular automáticamente las horas trabajadas a partir de hora de entrada y salida (no se ingresan manualmente ni se solicitan si no hay ambas horas).
3. EL SISTEMA NO DEBE permitir registrar asistencia con fecha futura.
4. EL SISTEMA NO DEBE permitir una hora de salida anterior a la hora de entrada.
5. CUANDO ya existe un registro de asistencia para el mismo trabajador y la misma fecha, EL SISTEMA DEBE rechazar el alta con un aviso de duplicado (`409 ASISTENCIA_DUPLICADA`) y permitir confirmar el reemplazo explícitamente (mismo patrón de confirmación blanda ya usado en `potreros`/`reproduccion` esta sesión), no crear un segundo registro silencioso.

### US-7: Pagos y liquidaciones

Como `ADMIN_NEGOCIO`, quiero generar la liquidación de un trabajador mostrando el detalle del cálculo antes de confirmar el pago.

**Criterios de aceptación**

1. EL TIPO DE PAGO DEBE ser uno de: `SALARIO`, `JORNAL`, `POR_ACTIVIDAD`, `BONO`, `COMISION`, `OTRO`.
2. CUANDO se solicita una previsualización de liquidación para un trabajador y un período, EL SISTEMA DEBE calcular, sin persistir nada todavía: jornadas/horas trabajadas en el período (de `asistencia`), actividades realizadas si aplica, el monto base según salario/jornal acordado, bonificaciones manuales, adelantos pendientes a descontar y préstamos con cuota vigente en el período, devolviendo el detalle línea por línea y el total a pagar.
3. CUANDO se confirma el pago, EL SISTEMA DEBE persistir el `Pago` con el desglose ya calculado (montos congelados — no se recalculan si después cambian los datos de asistencia/adelantos que lo originaron) y DEBE actualizar en la misma operación el saldo de los adelantos/préstamos descontados.
4. EL SISTEMA NO DEBE permitir confirmar un pago a un trabajador `INACTIVO` sin una confirmación explícita adicional, reservada a `ADMIN_NEGOCIO` (mismo patrón de confirmación blanda que US-6.5, pero sin opción de que `MAYORDOMO` la use — ver matriz de permisos).
5. EL PAGO DEBE registrarse en la moneda elegida (US-10) y conservar la tasa de cambio usada en ese momento.

### US-8: Adelantos

Como `ADMIN_NEGOCIO`, quiero registrar adelantos de dinero a un trabajador y ver su saldo pendiente.

**Criterios de aceptación**

1. CUANDO se registra un adelanto, EL SISTEMA DEBE requerir: trabajador, fecha, monto, moneda y motivo; método de entrega y observaciones son opcionales.
2. EL SISTEMA DEBE mostrar por trabajador: total adelantado, total descontado (vía pagos, US-7.3) y saldo pendiente — todo calculado, no una columna editable a mano.
3. UN ADELANTO CON SALDO EN CERO se considera saldado y no vuelve a ofrecerse para descuento en liquidaciones futuras.

### US-9: Préstamos

Como `ADMIN_NEGOCIO`, quiero registrar préstamos a un trabajador con cuotas y ver su estado de pago.

**Criterios de aceptación**

1. CUANDO se registra un préstamo, EL SISTEMA DEBE requerir: trabajador, fecha, monto original, moneda, número de cuotas, valor de cuota y fecha de inicio; observaciones es opcional.
2. EL SISTEMA DEBE permitir registrar abonos al préstamo (manuales o vía descuento automático en una liquidación, US-7.3).
3. EL SISTEMA DEBE mostrar: monto original, total pagado, saldo pendiente y próxima cuota (fecha y monto), todo calculado a partir de los abonos registrados.

### US-10: Moneda y tasa de cambio

Como `ADMIN_NEGOCIO`, quiero que las operaciones financieras del módulo conserven la moneda y la tasa usada en el momento, sin que cambios posteriores de la tasa alteren el histórico.

**Criterios de aceptación**

1. EL SISTEMA DEBE soportar `USD` y `VES` como monedas para `pagos`, `adelantos` y `prestamos` (y sus abonos).
2. CUANDO una operación se registra en una moneda distinta a la moneda de referencia del negocio, EL SISTEMA DEBE solicitar la tasa de cambio a usar en ese momento y guardarla junto con el monto original y su equivalente.
3. EL SISTEMA NUNCA DEBE recalcular retroactivamente un monto o equivalente ya guardado por un cambio posterior en la tasa — cada transacción es su propia fotografía (monto original, moneda original, tasa usada, equivalente).

### US-11: Reportes

Como `ADMIN_NEGOCIO`/`MAYORDOMO` (lectura), quiero reportes de trabajadores, asistencia, pagos y costo laboral, exportables.

**Criterios de aceptación**

1. EL SISTEMA DEBE ofrecer, como mínimo: reporte de trabajadores (activos/inactivos, distribución por cargo), reporte de asistencia (jornadas, horas, ausencias, permisos) y reporte de pagos (por trabajador, por período, por concepto).
2. EL SISTEMA DEBE ofrecer un reporte de costo laboral que muestre, para el negocio activo: cantidad de trabajadores, jornales/jornadas del período, total de salarios, total de bonos, otros pagos y costo laboral total.
3. TODOS LOS REPORTES DEL MÓDULO DEBEN poder exportarse a Excel, PDF y CSV (mismo mecanismo ya usado en `reportes`, spec `reportes`).
4. EL SISTEMA DEBE reutilizar los componentes de exportación/generación ya existentes en el módulo `reportes` (no se reimplementa la generación de archivos).

### US-12: Dashboard del módulo

Como `ADMIN_NEGOCIO`/`MAYORDOMO`, quiero un resumen ejecutivo del estado de la mano de obra al entrar al módulo.

**Criterios de aceptación**

1. EL DASHBOARD DEL MÓDULO DEBE mostrar: total de trabajadores, trabajadores activos, trabajadores presentes hoy, jornadas del período, horas trabajadas, total pagado, adelantos pendientes y préstamos pendientes.
2. EL DASHBOARD DEBE incluir al menos: trabajadores por cargo, costo laboral por período (evolución mensual) y resumen de asistencia reciente.
3. ESTE DASHBOARD ES INDEPENDIENTE del panel general (`/dashboard`, spec `dashboard`) — vive dentro del módulo `trabajadores`, no se mezcla con los KPIs de ganado/producción/sanidad. Integrar un resumen cruzado en el dashboard general queda fuera de alcance de v1.

### US-13: Historial y auditoría

Como `ADMIN_NEGOCIO`, quiero que los cambios críticos del módulo queden registrados y que ningún dato histórico se borre físicamente.

**Criterios de aceptación**

1. NINGÚN REGISTRO de asistencia, actividad realizada, pago, adelanto o préstamo DEBE eliminarse físicamente — solo se cancela/anula cambiando su estado, conservando el registro original.
2. EL SISTEMA DEBE registrar en un historial por trabajador los cambios críticos: alta/edición de datos del trabajador, cambios de cargo/asignación, pagos confirmados, adelantos y préstamos otorgados, y cambios de estado (activo/inactivo).
3. LA PESTAÑA "Historial" de la ficha del trabajador (US-2) DEBE mostrar este registro en orden cronológico.
