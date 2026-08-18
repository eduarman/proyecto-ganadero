# Tasks — Potreros

## Backend

- [ ] 1. Habilitar extensión PostGIS en la base de datos; modelar `potreros` en Prisma (tipo `Unsupported("geometry(Polygon,4326)")` o campo separado si Prisma no soporta el tipo nativamente — validar y documentar workaround elegido).
- [ ] 2. Implementar CRUD de `potreros` con validación de nombre único por tenant.
- [ ] 3. Implementar cálculo de ocupación actual y estado (normal/cerca límite/sobrecargado) a partir de `animales`.
- [ ] 4. Implementar `GET /potreros/:id/historial-rotacion` derivando periodos desde `animal_movimientos`.
- [ ] 5. Implementar `PotrerosService.validarCapacidad()` e integrarlo desde `POST /ganado/movimientos`.
- [ ] 6. Implementar `PATCH /potreros/:id/inactivar` con validación de cero animales asignados.
- [ ] 7. Implementar `GET /potreros/mapa` devolviendo GeoJSON.
- [ ] 8. Tests unitarios de cálculo de ocupación/capacidad y tests e2e del CRUD.

## Frontend

> **Avance 2026-08-09:** `PotrerosView.vue` (`modules/potreros/views/`) implementada a partir de `ScreenPotreros.dc.html`/`MobilePotreros.dc.html`, con datos mock (`mock/potreros.mock.ts`) — formulario de rotación (tabs Ingreso/Salida), grid de tarjetas de potrero con % de ocupación y tabla/lista de historial de rotación, responsiva. Sin backend/PostGIS, sin `PotreroMapEditor.vue`/`MapaPotrerosView.vue` (Leaflet), sin `OcupacionBadge.vue` ni `DetallePotreroView.vue` separados. Ver memoria `project-frontend-v1`.

- [ ] 9. Crear `modules/potreros` con estructura de `design.md`.
- [ ] 10. Implementar `ListaPotrerosView.vue` + `OcupacionBadge.vue`.
- [ ] 11. Implementar `PotreroForm.vue` (crear/editar, sin mapa).
- [ ] 12. Integrar Leaflet y construir `PotreroMapEditor.vue` (dibujo de polígono).
- [ ] 13. Implementar `MapaPotrerosView.vue` consumiendo `GET /potreros/mapa`.
- [ ] 14. Implementar `DetallePotreroView.vue` con historial de rotación.
- [ ] 15. Integrar advertencia de sobrecarga en `MoverAnimalesModal.vue` (módulo `ganado`).
- [ ] 16. Tests Vitest de composables; test e2e de alta de potrero → mover animal → ver ocupación actualizada.

## Dependencias

- Depende de: `ganado` (fuente de ocupación y movimientos).
- Bloqueante para: advertencia de capacidad en `ganado`, sección de potreros en `dashboard` y `reportes`.
