# Requirements — Suscripciones y Negocios (Multi-sede)

Referencia: `.claude/steering/subscriptions.md`.

## User Stories

### US-1: Ver estado de suscripción

Como `ADMIN_NEGOCIO`, quiero ver el plan actual, su uso y su fecha de renovación.

**Criterios de aceptación**

1. CUANDO `ADMIN_NEGOCIO` accede a `/suscripcion`, EL SISTEMA DEBE mostrar plan actual, precio, fecha de renovación, uso actual de usuarios y negocios vs. límites del plan.
2. SI la cuenta está `suspendida`, ENTONCES EL SISTEMA DEBE mostrar de forma prominente el motivo y la acción para regularizar.

### US-2: Upgrade de plan

Como `ADMIN_NEGOCIO`, quiero subir de plan para desbloquear más usuarios o negocios.

**Criterios de aceptación**

1. CUANDO el usuario selecciona un plan superior y confirma el pago, EL SISTEMA DEBE actualizar `cuentas.plan_id` inmediatamente (upgrade es inmediato, no espera al ciclo de facturación) y ajustar el prorrateo según la pasarela de pago.
2. EL UPGRADE nunca requiere validación de límites (siempre amplía, no reduce).

### US-3: Downgrade de plan

Como `ADMIN_NEGOCIO`, quiero bajar de plan si ya no necesito tantos recursos.

**Criterios de aceptación**

1. CUANDO el usuario solicita downgrade, EL SISTEMA DEBE validar que los usuarios activos y negocios activos actuales quepan en los límites del nuevo plan.
2. SI no caben, ENTONCES EL SISTEMA DEBE rechazar con `409` listando específicamente qué excede (ej. "Tienes 2 negocios activos, el Plan 2 permite 1. Desactiva o elimina uno antes de continuar.") sin aplicar el cambio.
3. CUANDO sí caben, EL SISTEMA DEBE aplicar el downgrade al finalizar el ciclo de facturación actual (no inmediatamente), mostrando al usuario la fecha efectiva.

### US-4: Gestión de negocios/localidades (solo Plan 3)

Como `ADMIN_NEGOCIO` con Plan 3, quiero crear y administrar múltiples negocios/localidades bajo mi misma cuenta.

**Criterios de aceptación**

1. CUANDO el plan activo no es Plan 3, EL SISTEMA NO DEBE mostrar la opción de crear un negocio adicional (UI oculta) y el backend DEBE rechazar `POST /negocios` con `403 PLAN_LIMIT_REACHED` si se intenta igual.
2. CUANDO `ADMIN_NEGOCIO` con Plan 3 crea un nuevo negocio, EL SISTEMA DEBE validarlo contra `planes.max_negocios`, crearlo con datos aislados (nuevo `tenant_id`), y vincular automáticamente al creador como `ADMIN_NEGOCIO` de ese nuevo negocio.
3. CADA NEGOCIO DEBE tener nombre propio, y opcionalmente ubicación/dirección para diferenciarlos en el selector.
4. CUANDO `ADMIN_NEGOCIO` desactiva un negocio, EL SISTEMA DEBE conservar sus datos (no se borran) pero excluirlo de selectores activos y de agregaciones de reportes por defecto.
5. LOS DATOS de un negocio NUNCA DEBEN ser visibles ni cruzados con los de otro negocio, incluso perteneciendo a la misma cuenta — cada consulta se filtra por el `tenant_id` del negocio activo únicamente.

### US-5: Webhook de pagos

Como sistema, necesito reflejar el estado real de pago de la pasarela.

**Criterios de aceptación**

1. CUANDO llega un evento de pago exitoso, EL SISTEMA DEBE marcar `cuentas.estado = activa` y actualizar `fecha_renovacion`.
2. CUANDO llega un evento de pago fallido, EL SISTEMA DEBE marcar `cuentas.estado = suspendida` y disparar notificación al titular.
3. EL SISTEMA DEBE verificar la firma del webhook antes de procesar cualquier evento, y DEBE ser idempotente ante reenvíos del mismo evento.
