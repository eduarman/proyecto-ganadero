# Tasks — Gestión de Usuarios y Roles

## Backend

- [ ] 1. Modelar `invitaciones` y `usuario_negocio` en Prisma (coordinar con `auth-login` y `suscripciones-negocios`).
- [ ] 2. Implementar matriz de permisos `common/permissions/matrix.ts` (rol → set de permisos por módulo).
- [ ] 3. Implementar `RolesGuard` / `PermissionsGuard` y decoradores `@Roles()` / `@RequirePermission()`.
- [ ] 4. Implementar `PlanLimitInterceptor` reutilizable (usuarios y, más adelante, negocios).
- [ ] 5. Implementar `GET /usuarios` con conteo de uso vs. límite de plan.
- [ ] 6. Implementar flujo de invitación (`POST /usuarios/invitaciones`, reenviar, cancelar, aceptar).
- [ ] 7. Implementar `PATCH /usuarios/:id/rol` y `PATCH /usuarios/:id/desactivar` con revocación de tokens.
- [ ] 8. Implementar regla "no autodesactivarse si es único admin".
- [ ] 9. Implementar endpoints de `/perfil` (ver, editar, cambiar password).
- [ ] 10. Tests unitarios de guards/interceptor y tests e2e de los flujos de invitación y cambio de rol.

## Frontend

> **Avance 2026-08-09:** se implementó `CuentaView.vue` (`modules/cuenta/views/`, no `modules/perfil/` como indica `design.md`) a partir de `ScreenCuenta.dc.html`/`MobileCuenta.dc.html` — tarjeta de perfil, formulario de información personal, cambio de contraseña (visual) y cerrar sesión (funcional: `authStore.logout()` + redirige a `/login`). Cubre parcialmente la intención de UI del ítem 15 (`PerfilView.vue`/`CambiarPasswordForm.vue`), pero sin backend (`/perfil`) ni datos reales del usuario. No se tocó nada de gestión de usuarios/roles propiamente dicha (`ListaUsuariosView.vue`, `InvitarUsuarioModal.vue`, `AceptarInvitacionView.vue`). Ver memoria `project-frontend-v1`.

- [ ] 11. Crear `modules/usuarios` y `modules/perfil` con la estructura de `design.md`.
- [ ] 12. Implementar `ListaUsuariosView.vue` con badge de límite de plan.
- [ ] 13. Implementar `InvitarUsuarioModal.vue` con validación de rol y de límite.
- [ ] 14. Implementar `AceptarInvitacionView.vue` (ruta pública).
- [ ] 15. Implementar `PerfilView.vue` y `CambiarPasswordForm.vue`.
- [ ] 16. Agregar entradas de menú/routing condicionadas a `can('usuarios:view')`.
- [ ] 17. Tests Vitest de composables y test e2e del flujo invitar→aceptar→ver en listado.

## Dependencias

- Depende de: `auth-login` (modelo de usuarios y permisos), `suscripciones-negocios` (límites de plan).
