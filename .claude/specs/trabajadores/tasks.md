# Tasks — Trabajadores

## Backend

- [ ] 1. Modelar en Prisma: `cargos`, `actividades`, `trabajadores`, `asignaciones`, `actividades_realizadas`, `asistencias`, `pagos`, `pagos_adelantos`, `pagos_prestamos`, `adelantos`, `prestamos`, `prestamo_abonos`, `historial_trabajador` + enum `MonedaTrabajador`. Semilla del catálogo base de `actividades` (seed o alta automática al crear negocio, a definir).
- [ ] 2. Implementar CRUD de `trabajadores` (alta/edición/listado con búsqueda+filtros+orden) y `activar`/`inactivar`.
- [ ] 3. Implementar catálogos `cargos`/`actividades` (mismo patrón que `InsumoAlimentacion`/`ProductoSanitario`).
- [ ] 4. Implementar `asignaciones` (alta, cierre de vigente al abrir una nueva, `finalizar`).
- [ ] 5. Implementar `actividades_realizadas` (alta con `trabajador_ids`/`animal_ids`, validación de pertenencia al tenant).
- [ ] 6. Implementar `asistencias`: alta con cálculo de horas trabajadas, validaciones (sin fecha futura, salida ≥ entrada), y confirmación blanda ante duplicado (`tenant_id, trabajador_id, fecha`).
- [ ] 7. Implementar `TrabajadoresService.obtenerFicha()` agregando indicadores (jornadas, horas, total pagado, adelantos/préstamos pendientes) sin persistirlos.
- [ ] 8. Implementar `adelantos` (alta, cálculo de saldo pendiente) y `prestamos` + `prestamo_abonos` (alta, abono manual, cálculo de saldo/próxima cuota).
- [ ] 9. Implementar `POST /trabajadores/pagos/previsualizar` calculando el desglose (asistencia/actividad del período, salario/jornal, bonificaciones, adelantos y cuotas de préstamo pendientes) sin persistir.
- [ ] 10. Implementar `POST /trabajadores/pagos` confirmando el pago con el detalle congelado, actualizando en la misma transacción `adelantos.monto_descontado`/`prestamos` vía `pagos_adelantos`/`pagos_prestamos`, con bloqueo de "trabajador inactivo sin confirmar" restringido a `ADMIN_NEGOCIO`.
- [ ] 11. Implementar el registro en `historial_trabajador` desde cada service que muta datos críticos (alta/edición trabajador, asignaciones, pagos, adelantos, préstamos, cambios de estado).
- [ ] 12. Implementar reportes (`trabajadores`, `asistencia`, `pagos`, `costo-laboral`) y su exportación reutilizando `ExportService` de `reportes`.
- [ ] 13. Implementar `GET /trabajadores/dashboard` (KPIs + series para gráficos del módulo).
- [ ] 14. Definir y aplicar la matriz de `@Roles()` por ruta según la tabla de `design.md` (incluye el caso `MAYORDOMO` solo-lectura en pagos/adelantos/préstamos).
- [ ] 15. Tests unitarios de: cálculo de horas trabajadas, cálculo de saldo de adelantos/préstamos, armado de la previsualización de liquidación, confirmación de pago (congelamiento de montos + actualización de saldos), y bloqueo de pago a inactivo. Tests e2e del flujo alta trabajador → asistencia → previsualizar → confirmar pago.

## Frontend

- [ ] 16. Crear `modules/trabajadores` con la estructura de `design.md`.
- [ ] 17. Implementar `ListaTrabajadoresView.vue` (tabla, búsqueda, filtros, alta vía `TrabajadorForm.vue`).
- [ ] 18. Implementar `FichaTrabajadorView.vue` con las 8 pestañas de US-2, consumiendo `GET /trabajadores/:id/ficha` + endpoints por pestaña.
- [ ] 19. Implementar `AsignacionesView.vue`.
- [ ] 20. Implementar `AsistenciaView.vue` con manejo del flujo de confirmación ante duplicado.
- [ ] 21. Implementar `ActividadesView.vue` (catálogo + registro de actividad realizada, selector de trabajadores y animales).
- [ ] 22. Implementar `PagosView.vue` + `LiquidacionPreview.vue` (previsualizar → confirmar) + `MonedaTasaInput.vue`.
- [ ] 23. Implementar `AdelantosPrestamosView.vue` (alta de adelanto/préstamo, registro de abonos, saldos).
- [ ] 24. Implementar `ReportesTrabajadoresView.vue` reutilizando los componentes de exportación/gráficos de `modules/reportes`.
- [ ] 25. Implementar `DashboardTrabajadoresView.vue`.
- [ ] 26. Agregar "Trabajadores" (con submenús) a `shared/nav.ts` y al router, visible solo para `ADMIN_NEGOCIO`/`MAYORDOMO`.
- [ ] 27. Tests Vitest de `useTrabajadores.ts`; test e2e de alta trabajador → asistencia → generar liquidación → ver reflejado en ficha y reportes.

## Dependencias

- Depende de: `ganado` (referencia a `animal_ids` en actividades), `potreros` (asignación de trabajador a potrero), `reportes` (reutiliza `ExportService`), `usuarios-roles` (matriz de permisos, `RolesGuard`/`@Roles()` ya existentes — no depende de `usuarios-roles` estar terminado más que para el guard, que ya está implementado).
- No depende de `suscripciones-negocios` (no introduce límites de plan propios en v1).
- Introduce el primer manejo de moneda/tasa de cambio de la plataforma — si más adelante se generaliza a otros módulos, revisar si conviene extraer `moneda`/`tasa_cambio`/`monto_equivalente` a un tipo común reutilizable (fuera de alcance de v1, ver `requirements.md`).
