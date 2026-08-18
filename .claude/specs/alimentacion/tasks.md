# Tasks — Alimentación

## Backend

- [ ] 1. Modelar `insumos_alimentacion`, `planes_alimentacion`, `plan_alimentacion_items`, `plan_asignaciones`, `suministros`, `suministros_recurrentes` en Prisma.
- [ ] 2. Implementar CRUD de insumos con regla de "no eliminar si está en uso" (validar referencias en planes/suministros).
- [ ] 3. Implementar CRUD de planes de alimentación con items dinámicos.
- [ ] 4. Implementar asignación de plan a potrero/lote.
- [ ] 5. Implementar registro manual de suministros.
- [ ] 6. Implementar reglas recurrentes + job diario (BullMQ) que las materializa en `suministros`.
- [ ] 7. Implementar `GET /alimentacion/costos` con agregación por periodo/potrero/lote, marcando "costo parcial" si hay insumos sin costo unitario.
- [ ] 8. Implementar permiso granular `alimentacion:view-costos` en la matriz de permisos.
- [ ] 9. Tests unitarios del job de recurrencia y de agregación de costos; tests e2e del CRUD.

## Frontend

> **Avance 2026-08-09:** `AlimentacionView.vue` (`modules/alimentacion/views/`) implementada a partir de `ScreenAlimentacion.dc.html`/`MobileAlimentacion.dc.html`, con datos mock (`mock/alimentacion.mock.ts`) — KPIs, formulario de registro, costo por tipo de alimento (barras de progreso) y tabla/lista de consumo diario, responsiva. Sin backend, sin `InsumosView.vue`/`PlanesAlimentacionView.vue`/`AsignarPlanModal.vue`/reglas recurrentes, sin condicionar costos a `can('alimentacion:view-costos')`. Ver memoria `project-frontend-v1`.

- [ ] 10. Crear `modules/alimentacion` con estructura de `design.md`.
- [ ] 11. Implementar `InsumosView.vue` + `InsumoForm.vue`.
- [ ] 12. Implementar `PlanesAlimentacionView.vue` + `PlanAlimentacionForm.vue` (items dinámicos).
- [ ] 13. Implementar `AsignarPlanModal.vue`.
- [ ] 14. Implementar `RegistroSuministrosView.vue` + `RegistrarSuministroForm.vue` + `SuministroRecurrenteForm.vue`.
- [ ] 15. Condicionar visibilidad de costos con `can('alimentacion:view-costos')`.
- [ ] 16. Tests Vitest de composables; test e2e de crear plan → asignar → registrar suministro → ver costo agregado.

## Dependencias

- Depende de: `ganado` (lotes/animales), `potreros` (asignación por potrero).
- Alimenta a: `reportes` (costos de alimentación vs. producción).
