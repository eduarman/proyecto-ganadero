# Roles, Permisos y Seguridad

## Principio rector

**Toda validación de autorización se hace en el backend.** El frontend oculta/deshabilita UI según rol/permiso solo por UX — nunca es la barrera real. Cualquier endpoint debe funcionar correctamente (rechazar con 403) incluso si se lo llama directo sin pasar por la UI.

## Roles del sistema

Roles predefinidos, no editables por el usuario (evita explosión de complejidad en v1; permisos granulares custom quedan fuera de alcance por ahora):

| Rol | Descripción | Disponible desde |
|---|---|---|
| `SUPER_ADMIN` | Rol de plataforma (equipo del SaaS), no pertenece a ningún tenant. Soporte, gestión de cuentas, no accede a datos operativos de negocios salvo soporte explícito auditado. | Interno, no vendible |
| `ADMIN_NEGOCIO` | Administrador del negocio/localidad. Acceso total a todos los módulos de su(s) negocio(s). Único rol disponible en Plan 1. Gestiona usuarios, suscripción y (Plan 3) negocios. | Plan 1 |
| `MAYORDOMO` | Gestión operativa completa de un negocio: todos los módulos operativos (ganado, reproducción, potreros, alimentación, producción, sanidad, reportes de su negocio), sin acceso a suscripción/facturación ni alta de usuarios. | Plan 2+ |
| `OPERARIO` | Registro de eventos de campo (pesajes, tratamientos sanitarios, movimientos de potrero, eventos reproductivos puntuales). Sin acceso a reportes financieros, configuración ni gestión de usuarios. Solo lectura en módulos fuera de su alcance. | Plan 2+ |
| `VETERINARIO_EXTERNO` | Acceso de solo lectura/escritura acotado al módulo de Sanidad de un negocio específico al que fue invitado. (Diseñado en el modelo de datos desde v1; activación de UI puede diferirse). | Plan 2+ |

## Matriz de permisos por módulo (resumen)

| Módulo | ADMIN_NEGOCIO | MAYORDOMO | OPERARIO | VETERINARIO_EXTERNO |
|---|---|---|---|---|
| Dashboard | RW | R | R (limitado) | - |
| Gestión del ganado | RW | RW | R + crear eventos | R |
| Reproducción | RW | RW | RW (registrar) | R |
| Potreros | RW | RW | R + registrar movimiento | - |
| Alimentación | RW | RW | R + registrar consumo | - |
| Producción | RW | RW | RW (registrar) | - |
| Sanidad | RW | RW | RW (registrar) | RW |
| Reportes | RW | R | - | R (solo sanidad) |
| Usuarios | RW | - | - | - |
| Trabajadores (datos operativos) | RW | RW | - | - |
| Trabajadores (pagos/adelantos/préstamos) | RW | R | - | - |
| Suscripción/Negocios | RW | - | - | - |

Esta matriz es la fuente de verdad inicial; el detalle fino de acciones (ej. "puede eliminar" vs "puede crear") se especifica en `design.md` de cada spec de módulo.

## Modelo de permisos (implementación)

- Se modela como **rol → set de permisos** (no permisos 100% custom por usuario en v1). Tabla `permisos` (código, módulo, acción: `view|create|update|delete|export`) y tabla puente `rol_permisos`.
- Cada usuario tiene exactamente un rol **por negocio** al que pertenece (un mismo usuario podría, a futuro, tener distinto rol en distintos negocios del Plan 3 — el modelo de datos lo soporta desde v1 aunque la UI de v1 solo permita un negocio activo a la vez).
- El JWT incluye: `userId`, `tenantId` (negocio activo), `rol`. Cambiar de negocio activo (Plan 3) emite un nuevo token vía endpoint `POST /auth/switch-tenant`.

## Backend — capas de defensa

1. **`JwtAuthGuard`**: valida el token, resuelve el usuario.
2. **`TenantGuard`**: resuelve `tenantId` del token, lo inyecta en el request context, y valida que el usuario pertenezca a ese tenant. Todo query a Prisma pasa por un middleware/extension que agrega automáticamente `WHERE tenant_id = :tenantId` — evita el error humano de olvidar el filtro en un query nuevo.
3. **`PermissionsGuard`** + decorador `@RequirePermission('ganado:create')`: valida contra la matriz rol→permisos.
4. **`PlanLimitInterceptor`**: en operaciones de alta sensibles a límites de plan (crear usuario, crear negocio), valida contra `steering/subscriptions.md` antes de ejecutar el service.
5. **Row Level Security (RLS)** en PostgreSQL como defensa en profundidad: política que exige `tenant_id = current_setting('app.tenant_id')`, seteado por la conexión al inicio de cada request. Protege incluso ante un bug en el filtro del ORM.

## Frontend — capas de UX (no de seguridad)

- `router/guards.ts`: `beforeEach` que verifica sesión válida (redirige a `/login` si no) y permiso mínimo de la ruta (`meta.permission`), redirige a una vista "403 - No autorizado" si no cumple.
- `shared/composables/usePermissions.ts`: expone `can('modulo:accion')` para condicionar `v-if` en botones/secciones (ej. ocultar botón "Eliminar" a un OPERARIO).
- El store de auth (Pinia) guarda el usuario, rol, negocio activo y su set de permisos resuelto (obtenido en `/auth/me` tras login), evita recalcular en cada componente.

## Vista de login — requisitos de validación

Detalle funcional completo en `.claude/specs/auth-login/requirements.md`. Resumen de reglas transversales:

- Rate limiting por IP + por email (ej. 5 intentos/15min) contra fuerza bruta, vía `@nestjs/throttler`.
- Mensajes de error genéricos ("credenciales inválidas") — nunca revelar si el email existe o no.
- Password hasheado con `argon2` (preferido sobre bcrypt por resistencia a GPU).
- Bloqueo temporal de cuenta tras N intentos fallidos, con notificación por email al titular.
- Recuperación de contraseña vía token de un solo uso con expiración corta (ej. 30 min), enviado por email.
- Verificación de email obligatoria antes de operar (excepto flujo de onboarding donde se permite explorar en modo limitado — a decidir en `auth-login`).
- Sesión con refresh token rotativo (se invalida el anterior al usar uno nuevo) para detectar robo de token.

## Vista a nivel de usuario

Cada usuario autenticado tiene una vista de "Mi perfil" (`/perfil`) donde puede: editar sus datos, cambiar contraseña, ver su rol y negocio(s) asignados (solo lectura — la asignación de rol la hace `ADMIN_NEGOCIO` desde el módulo de usuarios), y cerrar sesión en todos los dispositivos. No puede auto-asignarse un rol distinto ni ver negocios a los que no pertenece.
