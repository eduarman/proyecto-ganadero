# Tasks — Reportes

## Backend

- [ ] 1. Modelar `reportes_generados` en Prisma; configurar storage de objetos (S3-compatible) y URLs firmadas.
- [ ] 2. Implementar `ReportesService.obtenerDatos()` por cada tipo, delegando a los services de `ganado`, `reproduccion`, `potreros`, `alimentacion`, `produccion`, `sanidad`.
- [ ] 3. Implementar `ExportService` con renderer PDF (Puppeteer) y Excel (exceljs).
- [ ] 4. Implementar `POST /reportes/:tipo/generar` + worker BullMQ `generar-reporte`.
- [ ] 5. Implementar `GET /reportes/generados/:id` y `GET /reportes/generados`.
- [ ] 6. Implementar reporte cruzado `costo_vs_produccion`.
- [ ] 7. Implementar `POST /reportes/consolidado` (solo Plan 3, solo `ADMIN_NEGOCIO`), agregando por negocio con desglose explícito.
- [ ] 8. Tests unitarios de agregación de cada tipo de reporte; test e2e del flujo asíncrono completo.

## Frontend

> **Avance 2026-08-09:** `ReportesView.vue` (`modules/reportes/views/`) implementada a partir de `ScreenReportes.dc.html`/`MobileReportes.dc.html`, con datos mock (`mock/reportes.mock.ts`) — tags de reportes, gráfico de barras de producción mensual, donut SVG de costos por categoría, línea de mortalidad anual (SVG, solo desktop) y tabla/lista de producción por lote. Sin backend, sin `CatalogoReportesView.vue`/`GenerarReporteView.vue`/`HistorialReportesView.vue` con polling/descarga, sin exportación PDF/Excel. Ver memoria `project-frontend-v1`.

- [ ] 9. Crear `modules/reportes` con estructura de `design.md`.
- [ ] 10. Implementar `CatalogoReportesView.vue` con filtrado por permiso/plan.
- [ ] 11. Implementar `FiltrosReporteForm.vue` y `GenerarReporteView.vue`.
- [ ] 12. Implementar `HistorialReportesView.vue` con polling de estado y descarga.
- [ ] 13. Implementar gráficos `CostoVsProduccionChart.vue` y `ComparativoPotrerosChart.vue` (reutilizables en dashboard).
- [ ] 14. Tests Vitest de `useReportes.ts` (polling); test e2e de generar reporte → esperar → descargar.

## Dependencias

- Depende de: todos los módulos operativos (`ganado`, `reproduccion`, `potreros`, `alimentacion`, `produccion`, `sanidad`), `suscripciones-negocios` (reporte consolidado).
