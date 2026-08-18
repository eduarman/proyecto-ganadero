# Design — Gestión de Usuarios y Roles

## Modelo de datos

```
invitaciones
├── id, email, negocio_id FK, rol, token_hash, invitado_por FK->usuarios.id
├── estado (pendiente|aceptada|cancelada|expirada), expira_en, created_at

usuario_negocio   (definida también en subscriptions.md)
├── usuario_id FK, negocio_id FK, rol ENUM(MAYORDOMO, OPERARIO, VETERINARIO_EXTERNO, ADMIN_NEGOCIO)
├── activo BOOLEAN DEFAULT true
├── PK (usuario_id, negocio_id)
```

Los roles (`ADMIN_NEGOCIO`, `MAYORDOMO`, `OPERARIO`, `VETERINARIO_EXTERNO`) son un ENUM fijo del sistema (ver `security-roles.md`), no una tabla editable en v1 — simplifica la validación de permisos (matriz hardcodeada en `common/permissions/matrix.ts`, no en base de datos).

## Endpoints (módulo `usuarios`)

| Método | Ruta | Guard | Descripción |
|---|---|---|---|
| GET | `/usuarios` | `Roles(ADMIN_NEGOCIO)` | Lista usuarios del negocio activo + uso vs límite de plan |
| POST | `/usuarios/invitaciones` | `Roles(ADMIN_NEGOCIO)` + `PlanLimitInterceptor` | Crea invitación |
| POST | `/usuarios/invitaciones/:id/reenviar` | `Roles(ADMIN_NEGOCIO)` | Reenvía email de invitación |
| DELETE | `/usuarios/invitaciones/:id` | `Roles(ADMIN_NEGOCIO)` | Cancela invitación pendiente |
| POST | `/invitaciones/:token/aceptar` | público (valida token) | Acepta invitación, crea/vincula usuario |
| PATCH | `/usuarios/:id/rol` | `Roles(ADMIN_NEGOCIO)` | Cambia rol dentro del negocio activo |
| PATCH | `/usuarios/:id/desactivar` | `Roles(ADMIN_NEGOCIO)` | Desactiva vínculo `usuario_negocio`, revoca tokens |
| GET | `/perfil` | `JwtAuthGuard` | Datos propios |
| PATCH | `/perfil` | `JwtAuthGuard` | Editar nombre/foto |
| PATCH | `/perfil/password` | `JwtAuthGuard` | Cambiar contraseña (requiere actual) |

`PlanLimitInterceptor` cuenta `usuario_negocio` activos del `negocio_id` contra `planes.max_usuarios` de la `cuenta` dueña de ese negocio antes de permitir `POST /usuarios/invitaciones`.

## Frontend

```
modules/usuarios/
├── views/
│   ├── ListaUsuariosView.vue      # tabla + badge "N de M usuarios" + botón invitar (disabled si límite alcanzado)
│   └── AceptarInvitacionView.vue  # ruta pública /invitaciones/:token
├── components/
│   ├── InvitarUsuarioModal.vue
│   ├── UsuarioRow.vue             # acciones cambiar rol / desactivar, condicionadas a can('usuarios:update')
│   └── LimitePlanBadge.vue        # reutilizado también en suscripciones-negocios
├── composables/
│   └── useUsuarios.ts
└── services/
    └── usuarios.api.ts

modules/perfil/
├── views/PerfilView.vue
└── components/CambiarPasswordForm.vue
```

- `InvitarUsuarioModal.vue` deshabilita el submit y muestra CTA de upgrade de plan si `usuarios.length >= plan.maxUsuarios` (validación de UX; el backend igual la re-valida).
- El selector de rol en `InvitarUsuarioModal` excluye `ADMIN_NEGOCIO` de las opciones (regla US-2.4).
