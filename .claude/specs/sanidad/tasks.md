# Tasks — Sanidad

## Backend

- [ ] 1. Modelar `productos_sanitarios`, `protocolos_sanitarios`, `aplicaciones_sanitarias`, `diagnosticos_sanitarios`, `cuarentenas` en Prisma.
- [ ] 2. Implementar CRUD de productos y protocolos.
- [ ] 3. Implementar registro individual y masivo de aplicaciones, con cálculo de `proxima_fecha_esperada`.
- [ ] 4. Implementar registro de diagnósticos (con vínculo opcional a tratamiento).
- [ ] 5. Implementar inicio/cierre de cuarentena.
- [ ] 6. Implementar job diario (BullMQ) que evalúa protocolos activos contra el padrón de animales.
- [ ] 7. Implementar `GET /sanidad/alertas` combinando refuerzos vencidos y protocolos no aplicados.
- [ ] 8. Implementar rol `VETERINARIO_EXTERNO` en la matriz de permisos (acceso acotado a `sanidad` + lectura de `ganado`).
- [ ] 9. Tests unitarios del cálculo de próxima fecha y del matcher de protocolos; tests e2e del flujo completo.

## Frontend

> **Avance 2026-08-09:** `SanidadView.vue` (`modules/sanidad/views/`) implementada a partir de `ScreenSanidad.dc.html`/`MobileSanidad.dc.html`, con datos mock (`mock/sanidad.mock.ts`) — formulario de registro (tabs Vacunación/Tratamiento), calendario de vacunación y tabla/lista de historial sanitario, responsiva. Sin backend, sin `ProductosSanitariosView.vue`/`ProtocolosView.vue`/manejo de cuarentenas/`VeterinarioLayout.vue`, sin integración con `DetalleAnimalView` de `ganado`. Ver memoria `project-frontend-v1`.

- [ ] 10. Crear `modules/sanidad` con estructura de `design.md`.
- [ ] 11. Implementar `ProductosSanitariosView.vue` y `ProtocolosView.vue`.
- [ ] 12. Implementar `RegistroAplicacionesView.vue` (individual + masivo) y `DiagnosticoForm.vue`.
- [ ] 13. Implementar manejo de cuarentenas (`CuarentenaBadge.vue` + formulario de inicio/fin).
- [ ] 14. Implementar `AlertasSanitariasView.vue`.
- [ ] 15. Integrar `HistorialSanitario.vue` en tab Sanidad de `DetalleAnimalView` (módulo `ganado`) y `CuarentenaBadge.vue` en `ListaGanadoView`.
- [ ] 16. Implementar `VeterinarioLayout.vue` y routing acotado para el rol `VETERINARIO_EXTERNO`.
- [ ] 17. Tests Vitest de composables; test e2e de aplicación masiva → alerta de refuerzo generada.

## Dependencias

- Depende de: `ganado` (animales), `potreros` (aplicación masiva por potrero).
- Alimenta a: `dashboard` (alertas sanitarias), `reportes`.
