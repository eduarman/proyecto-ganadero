# Design — Suscripciones y Negocios

Modelo de datos base ya definido en `.claude/steering/subscriptions.md` (`cuentas`, `planes`, `negocios`, `usuario_negocio`). Este documento cubre los endpoints y flujos específicos.

## Endpoints (módulos `suscripciones` y `negocios`)

| Método | Ruta | Guard | Descripción |
|---|---|---|---|
| GET | `/suscripcion` | `Roles(ADMIN_NEGOCIO)` | Estado de plan, uso, renovación |
| GET | `/suscripcion/planes` | `JwtAuthGuard` | Catálogo de planes disponibles |
| POST | `/suscripcion/upgrade` | `Roles(ADMIN_NEGOCIO)` | Cambia a plan superior, integra pasarela de pago |
| POST | `/suscripcion/downgrade` | `Roles(ADMIN_NEGOCIO)` + validación de límites | Programa downgrade a fin de ciclo |
| POST | `/webhooks/pagos` | firma HMAC (no JWT) | Recibe eventos de la pasarela |
| GET | `/negocios` | `JwtAuthGuard` | Lista negocios del usuario actual |
| POST | `/negocios` | `Roles(ADMIN_NEGOCIO)` + `PlanLimitInterceptor` | Crea negocio nuevo (solo Plan 3) |
| PATCH | `/negocios/:id` | `Roles(ADMIN_NEGOCIO)` + pertenencia | Editar nombre/dirección |
| PATCH | `/negocios/:id/desactivar` | `Roles(ADMIN_NEGOCIO)` + pertenencia | Desactiva negocio |

## Flujo de downgrade

```
POST /suscripcion/downgrade { planId }
  → DowngradeValidatorService.validar(cuentaId, planId)
      cuenta usuarios activos = COUNT(usuario_negocio WHERE negocio_id IN cuenta.negocios AND activo)
      cuenta negocios activos = COUNT(negocios WHERE cuenta_id AND activo)
      SI usuarios activos > nuevoPlan.max_usuarios O negocios activos > nuevoPlan.max_negocios
        → 409 { excede: ['usuarios'|'negocios'], actual, limite }
      SINO
        → crea registro `cambios_plan_programados` { cuenta_id, plan_id, efectivo_en: cuenta.fecha_renovacion }
        → (job programado aplica el cambio real en la fecha efectiva vía BullMQ delayed job)
```

## Integración de pasarela de pago

- Se abstrae detrás de `PaymentGatewayPort` (interfaz) con una implementación concreta (ej. Stripe) inyectada — permite cambiar de proveedor sin tocar `SuscripcionesService`.
- El frontend nunca maneja datos de tarjeta directamente: usa el SDK/Elements del proveedor (ej. Stripe Elements) que tokeniza en el cliente; el backend solo recibe el token/`payment_method_id`, nunca el PAN.
- `POST /webhooks/pagos` valida la firma (`Stripe-Signature` o equivalente), procesa de forma idempotente usando `event_id` (tabla `eventos_pago_procesados` con UNIQUE en `event_id`).

## Frontend

```
modules/suscripciones/
├── views/
│   ├── SuscripcionView.vue        # estado actual, uso, botones upgrade/downgrade
│   └── PlanesComparativaView.vue  # tabla comparativa de los 3 planes
├── components/
│   ├── UsoPlanCard.vue            # barras de progreso usuarios/negocios vs límite
│   ├── ConfirmarDowngradeModal.vue # muestra el detalle de qué excede si el backend rechaza
│   └── CheckoutForm.vue           # wrapper del SDK de la pasarela
└── services/suscripciones.api.ts

modules/negocios/
├── views/GestionNegociosView.vue  # solo accesible/visible si plan == Plan 3
├── components/
│   ├── NegocioCard.vue
│   └── CrearNegocioModal.vue
└── services/negocios.api.ts
```

- `GestionNegociosView.vue` se oculta del menú completamente si `plan.maxNegocios <= 1`, no solo se deshabilita — evita confundir a usuarios de Plan 1/2.
- `TenantSwitcher.vue` (definido en `auth-login/design.md`) consume `GET /negocios` para poblar el selector.
