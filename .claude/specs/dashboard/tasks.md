# Tasks — Panel General (Dashboard)

## Backend

- [ ] 1. Implementar `DashboardService.obtenerResumen()` componiendo llamadas internas a services de `ganado`, `potreros`, `produccion`, `sanidad`, `reproduccion`.
- [ ] 2. Implementar filtrado del payload según matriz de permisos del rol solicitante.
- [ ] 3. Implementar `GET /dashboard/resumen`.
- [ ] 4. Optimizar con cache corto (ej. Redis, TTL 60s por tenant) dado que agrega múltiples fuentes — invalidar en escrituras relevantes o aceptar TTL corto sin invalidación activa (definir según carga real).
- [ ] 5. Tests unitarios de armado del payload por rol (verificar que se omiten secciones sin permiso) y test e2e del endpoint.

## Frontend

> **Avance 2026-08-09:** `DashboardView.vue` (`modules/dashboard/views/`) implementada a partir de `ScreenHome.dc.html`/`MobileHome.dc.html` del proyecto de Claude Design, con datos mock (`mock/dashboard.mock.ts`) — KPIs, ranking de productividad, producción de la semana, alertas y accesos directos, responsiva (grid desktop / scroll horizontal + accesos rápidos en mobile). `KpiCard.vue` (ítem 8) existe como componente compartido (`shared/components/`). Sin backend (`DashboardService`), sin `AlertasPanel.vue`/`TendenciasSection.vue` como componentes separados, sin recarga por cambio de negocio activo. Ver memoria `project-frontend-v1`.

- [ ] 6. Crear `modules/dashboard` con estructura de `design.md`.
- [ ] 7. Implementar `DashboardView.vue` con grid responsive (Bootstrap) de KPI cards.
- [ ] 8. Implementar `KpiCard.vue` y `AlertasPanel.vue` con links directos a la acción.
- [ ] 9. Implementar `TendenciasSection.vue` reutilizando charts de `modules/reportes`.
- [ ] 10. Configurar `/dashboard` como ruta de aterrizaje por defecto tras login.
- [ ] 11. Implementar recarga automática ante cambio de negocio activo.
- [ ] 12. Tests Vitest de `useDashboard.ts`; test e2e de login → dashboard con datos correctos del tenant activo.

## Dependencias

- Depende de: **todos** los módulos operativos (`ganado`, `potreros`, `produccion`, `sanidad`, `reproduccion`) y de `auth-login` (negocio activo). Es, junto con `reportes`, de los últimos módulos a implementar en el roadmap.
