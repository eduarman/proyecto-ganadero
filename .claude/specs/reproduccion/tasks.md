# Tasks — Eventos Reproductivos

## Backend

- [ ] 1. Modelar `celos`, `servicios`, `diagnosticos_gestacion`, `partos`, `destetes` en Prisma; agregar configuración reproductiva por negocio.
- [ ] 2. Implementar `POST /reproduccion/celos`.
- [ ] 3. Implementar `POST /reproduccion/servicios` con validación de servicio activo duplicado (US-2.3).
- [ ] 4. Implementar `POST /reproduccion/diagnosticos` actualizando `servicios.estado`.
- [ ] 5. Implementar `POST /reproduccion/partos` con creación opcional de animal cría (llamada interna a `GanadoService`).
- [ ] 6. Implementar `POST /reproduccion/destetes`.
- [ ] 7. Implementar cálculo de calendario reproductivo (`GET /reproduccion/calendario`) y job periódico de alertas (BullMQ).
- [ ] 8. Implementar `GET /reproduccion/animal/:animalId` (línea de tiempo).
- [ ] 9. Tests unitarios de cálculo de fechas estimadas (celo, diagnóstico, parto, destete) y e2e del ciclo completo servicio→diagnóstico→parto→destete.

## Frontend

> **Avance 2026-08-09:** `ReproduccionView.vue` (`modules/reproduccion/views/`) implementada a partir de `ScreenReproduccion.dc.html`/`MobileReproduccion.dc.html`, con datos mock (`mock/reproduccion.mock.ts`) — formulario de registro (tabs Inseminación/Servicio natural/Palpación), partos próximos y tabla/lista de vacas preñadas, responsiva. Sin backend, sin modales dedicados por tipo de evento, sin `LineaTiempoReproductiva.vue` integrada al detalle de `ganado`. Ver memoria `project-frontend-v1`.

- [ ] 10. Crear `modules/reproduccion` con estructura de `design.md`.
- [ ] 11. Implementar los modales de registro (celo, servicio, diagnóstico, parto, destete) con validación de campos requeridos.
- [ ] 12. Implementar `RegistrarPartoModal.vue` con flujo de alta de cría inline.
- [ ] 13. Implementar `CalendarioReproductivoView.vue` con secciones de eventos próximos/vencidos.
- [ ] 14. Implementar `LineaTiempoReproductiva.vue` e integrarla al tab "Reproducción" de `DetalleAnimalView.vue` (módulo `ganado`).
- [ ] 15. Tests Vitest de composables; test e2e del ciclo completo desde la UI.

## Dependencias

- Depende de: `ganado` (entidad animal, alta de cría).
- Alimenta a: `dashboard` (alertas), `reportes` (indicadores de natalidad).
