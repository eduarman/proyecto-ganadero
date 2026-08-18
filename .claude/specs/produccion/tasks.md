# Tasks — Producción

## Backend

- [ ] 1. Agregar `orientacion_productiva` a la configuración del negocio.
- [ ] 2. Modelar `registros_leche` y `registros_peso` en Prisma con UNIQUE constraints indicados.
- [ ] 3. Implementar registro individual y masivo (`/lote`) de leche con upsert transaccional.
- [ ] 4. Implementar registro individual y masivo de peso con upsert transaccional.
- [ ] 5. Implementar cálculo de curva de producción de leche y de GDP.
- [ ] 6. Implementar `GET /produccion/indicadores` con agregaciones por periodo/potrero/lote.
- [ ] 7. Tests unitarios de cálculo de GDP (casos borde: un solo pesaje, pesajes en la misma fecha) y e2e de registro masivo.

## Frontend

> **Avance 2026-08-09:** `ProduccionView.vue` (`modules/produccion/views/`) implementada a partir de `ScreenProduccion.dc.html`/`MobileProduccion.dc.html`, con datos mock (`mock/produccion.mock.ts`) — KPIs, formulario de registro de leche, gráfico de barras de producción mensual (CSS, no chart.js) y tabla/lista de producción diaria por turno, responsiva. Sin backend, sin `TablaRegistroMasivo.vue`/`RegistroPesoView.vue`/`CurvaProduccionChart.vue`/`GdpChart.vue` con vue-chartjs. Ver memoria `project-frontend-v1`.

- [ ] 8. Crear `modules/produccion` con estructura de `design.md`.
- [ ] 9. Implementar `TablaRegistroMasivo.vue` genérica (leche/peso).
- [ ] 10. Implementar `RegistroLecheView.vue` (condicionada a orientación productiva) y `RegistroPesoView.vue`.
- [ ] 11. Implementar `CurvaProduccionChart.vue` y `GdpChart.vue` con vue-chartjs, integradas en `DetalleAnimalView` (módulo `ganado`).
- [ ] 12. Implementar `IndicadoresProduccionView.vue` con filtros de periodo y comparación entre potreros/lotes.
- [ ] 13. Tests Vitest de composables; test e2e de carga masiva → ver curva actualizada.

## Dependencias

- Depende de: `ganado` (animales), `potreros` (agrupación por potrero).
- Alimenta a: `dashboard`, `reportes`.
