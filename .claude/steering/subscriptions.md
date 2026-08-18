# Suscripciones y Multi-tenancy — Diseño Técnico

## Modelo de datos (nivel plataforma, sin `tenant_id`)

Estas tablas viven fuera del esquema multi-tenant (no llevan `tenant_id`, son de la plataforma):

- `cuentas` (billing account): titular de la suscripción. Un `usuario` (el que se registró originalmente) es dueño de una `cuenta`. Campos: `id`, `email_titular`, `plan_id`, `estado` (`activa|suspendida|cancelada|periodo_prueba`), `fecha_inicio`, `fecha_renovacion`, `metodo_pago_ref` (referencia externa a pasarela de pago, nunca datos de tarjeta).
- `planes`: catálogo de planes (`Plan 1`, `Plan 2`, `Plan 3`), con columnas `max_usuarios`, `max_negocios`, `precio_mensual`, `features_json` (flags de features habilitadas, para futura granularidad).
- `negocios` (tenants): `id`, `cuenta_id` (FK a `cuentas`), `nombre`, `estado` (`activo|inactivo`). **Este `negocios.id` es el `tenant_id`** que se replica en todas las tablas operativas.
- `usuarios` (usuarios de plataforma, autenticación): `id`, `email`, `password_hash`, `cuenta_id` (a qué cuenta de facturación pertenece — relevante para saber quién administra el plan).
- `usuario_negocio`: tabla puente `usuario_id` + `negocio_id` + `rol` — permite que un usuario pertenezca a uno o varios negocios (Plan 3) con rol independiente por negocio.

## Modelo de datos (nivel tenant, con `tenant_id` = `negocio_id`)

Todas las tablas de dominio operativo (`animales`, `potreros`, `eventos_reproductivos`, `registros_alimentacion`, `registros_produccion`, `registros_sanidad`, etc.) incluyen una columna `tenant_id UUID NOT NULL` con FK a `negocios.id`, indexada, y siempre parte del índice compuesto de las queries frecuentes (ej. `(tenant_id, animal_id)`).

## Por qué shared-DB con `tenant_id` (y no schema-per-tenant)

- Migraciones de esquema se aplican una sola vez, no N veces (N = cantidad de negocios). Crítico en etapa temprana con iteración rápida del modelo de datos.
- Menor costo operativo de infraestructura — un solo pool de conexiones, un solo backup a gestionar.
- El volumen esperado por tenant (una finca ganadera) es bajo-medio (miles a decenas de miles de registros/año), no justifica el overhead de schema-per-tenant.
- Camino de escape documentado: si a futuro un cliente enterprise exige aislamiento físico, se migra ese tenant puntual a una base de datos dedicada (mismo schema, distinta conexión) sin rediseñar la app — el código ya filtra por `tenant_id` en todos lados.

## Enforcement de límites de plan

Se valida en dos momentos, siempre en backend:

1. **Al crear el recurso** (nuevo usuario, nuevo negocio): `PlanLimitInterceptor` (ver `security-roles.md`) consulta `planes.max_usuarios` / `planes.max_negocios` del plan activo de la `cuenta`, cuenta los recursos activos actuales, y rechaza con `403 PLAN_LIMIT_REACHED` + payload indicando el límite y sugiriendo upgrade.
2. **Al hacer downgrade de plan**: endpoint `PUT /suscripciones/plan` valida que los recursos activos actuales quepan en el nuevo plan antes de aplicar el cambio; si no, responde `409` con el detalle de qué hay que reducir primero (ej. "tienes 3 usuarios activos, el Plan 1 permite 1").

## Cambio de negocio activo (Plan 3)

- El usuario con acceso a varios negocios ve un selector de negocio en el topbar.
- `POST /auth/switch-tenant { negocioId }` valida pertenencia (`usuario_negocio`), emite un nuevo JWT con el `tenantId` actualizado.
- El frontend limpia el estado cacheado (Pinia stores de datos operativos) al cambiar de negocio para evitar fugas visuales de datos de un tenant a otro.

## Ciclo de vida de suscripción

- **Trial**: al registrarse, `cuenta.estado = periodo_prueba` por N días (a definir, ej. 14) con acceso equivalente a Plan 2, para que el usuario evalúe el producto sin fricción.
- **Activa**: pago al día, acceso completo según plan contratado.
- **Suspendida** (pago fallido / vencimiento sin renovar): la cuenta y sus negocios pasan a **modo solo-lectura** — los usuarios pueden ver y exportar datos pero no crear/editar/eliminar. No se borran datos. Se muestra banner persistente con CTA de regularización.
- **Cancelada**: igual a suspendida pero tras un período de gracia definido (ej. 30 días en solo-lectura), tras el cual se programa anonimización/borrado según política de retención (a definir con legal/GDPR si aplica mercado).

## Webhooks de pasarela de pago

El backend expone `POST /webhooks/pagos` (endpoint público pero verificado por firma HMAC del proveedor, nunca por JWT de usuario) para recibir eventos de la pasarela (pago exitoso, pago fallido, cancelación) y transicionar el `estado` de la `cuenta` correspondiente. Idempotente por `event_id` del proveedor.
