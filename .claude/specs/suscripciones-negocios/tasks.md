# Tasks — Suscripciones y Negocios

## Backend

- [ ] 1. Modelar `cuentas`, `planes`, `negocios`, `cambios_plan_programados`, `eventos_pago_procesados` en Prisma; seed de los 3 planes.
- [ ] 2. Implementar `PaymentGatewayPort` + adaptador concreto del proveedor elegido.
- [ ] 3. Implementar `GET /suscripcion` y `GET /suscripcion/planes`.
- [ ] 4. Implementar `POST /suscripcion/upgrade` (inmediato, integrando checkout del proveedor).
- [ ] 5. Implementar `DowngradeValidatorService` y `POST /suscripcion/downgrade` con job programado (BullMQ) para aplicar el cambio en la fecha de renovación.
- [ ] 6. Implementar `POST /webhooks/pagos` con verificación de firma e idempotencia.
- [ ] 7. Implementar `GET/POST/PATCH /negocios` con `PlanLimitInterceptor` y validación de pertenencia.
- [ ] 8. Extender `PlanLimitInterceptor` (creado en `usuarios-roles`) para cubrir el recurso `negocios`.
- [ ] 9. Tests unitarios de `DowngradeValidatorService` (casos límite exactos) y e2e de upgrade/downgrade/webhook.

## Frontend

- [ ] 10. Crear `modules/suscripciones` y `modules/negocios` con estructura de `design.md`.
- [ ] 11. Implementar `SuscripcionView.vue` + `UsoPlanCard.vue`.
- [ ] 12. Implementar `PlanesComparativaView.vue` (tabla de los 3 planes, reutilizando contenido de `product.md`).
- [ ] 13. Integrar `CheckoutForm.vue` con el SDK del proveedor de pago elegido.
- [ ] 14. Implementar `ConfirmarDowngradeModal.vue` mostrando el detalle de qué excede.
- [ ] 15. Implementar `GestionNegociosView.vue`, `NegocioCard.vue`, `CrearNegocioModal.vue`, visibles solo en Plan 3.
- [ ] 16. Integrar `TenantSwitcher.vue` (de `auth-login`) con `GET /negocios`.
- [ ] 17. Tests e2e: intentar crear 2do negocio en Plan 1/2 (debe estar oculto/bloqueado), crear negocio en Plan 3, downgrade con exceso de recursos.

## Dependencias

- Depende de: `auth-login` (usuarios, JWT con tenantId), `usuarios-roles` (`PlanLimitInterceptor`).
- Bloqueante para: cualquier módulo operativo que dependa de "negocio activo" (todos).
