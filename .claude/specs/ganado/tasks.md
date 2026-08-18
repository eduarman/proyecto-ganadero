# Tasks — Gestión del Ganado

## Backend

- [ ] 1. Modelar `animales`, `animal_movimientos`, `animal_bajas` en Prisma con índices indicados.
- [ ] 2. Implementar `GanadoService`/`GanadoController`: CRUD base + filtros + paginación.
- [ ] 3. Implementar cálculo de categoría etaria sugerida (función pura, testeada con casos borde por especie/sexo).
- [ ] 4. Implementar `POST /ganado/:id/baja` con validación de eventos reproductivos pendientes (US-4.3).
- [ ] 5. Implementar `POST /ganado/movimientos` (individual y por lote) actualizando `potrero_actual_id` + historial.
- [ ] 6. Implementar importación CSV/Excel con reporte fila-a-fila de éxitos/errores (`POST /ganado/importar`) y `GET /ganado/plantilla-importacion`.
- [ ] 7. Aplicar `TenantGuard` + índices `(tenant_id, ...)` en todas las queries; test que confirma aislamiento entre tenants.
- [ ] 8. Tests unitarios y e2e de alta, baja, movimiento e importación.

## Frontend

> **Avance 2026-08-09:** `GanadoView.vue` (`modules/ganado/views/`) implementada a partir de `ScreenGanado.dc.html`/`MobileGanado.dc.html`, con datos mock (`mock/ganado.mock.ts`, 8 animales con historial) — búsqueda cliente-side, lista + panel de detalle en desktop (foto placeholder, stats, historial), acordeón en mobile, y formulario de alta visual (sin persistencia). Sin backend, sin paginación server-side, sin `AnimalFiltros.vue`/`GenealogiaTree.vue`/`MoverAnimalesModal.vue`/`DarDeBajaModal.vue`/`ImportarGanadoView.vue` ni `ganado.store.ts` reales. Ver memoria `project-frontend-v1`.

- [ ] 9. Crear `modules/ganado` con la estructura de `design.md`.
- [ ] 10. Implementar `ListaGanadoView.vue` + `AnimalFiltros.vue` con paginación server-side.
- [ ] 11. Implementar `AnimalForm.vue` (crear/editar) con validación de identificador único (feedback async).
- [ ] 12. Implementar `DetalleAnimalView.vue` con tabs y `GenealogiaTree.vue`.
- [ ] 13. Implementar `MoverAnimalesModal.vue` (selección múltiple desde el listado).
- [ ] 14. Implementar `DarDeBajaModal.vue` con advertencia de eventos pendientes.
- [ ] 15. Implementar `ImportarGanadoView.vue` con descarga de plantilla y resumen de resultado.
- [ ] 16. Implementar `ganado.store.ts` como catálogo liviano reutilizable por otros módulos.
- [ ] 17. Tests Vitest de composables/store; test e2e de alta de animal → aparece en listado → ficha muestra datos.

## Dependencias

- Depende de: `auth-login`/`usuarios-roles` (permisos), `potreros` (para `potrero_actual_id` y movimientos — puede desarrollarse en paralelo con mocks de potrero).
- Bloqueante para: `reproduccion`, `alimentacion`, `produccion`, `sanidad`, `dashboard`, `reportes` (todos referencian `animal_id`).
