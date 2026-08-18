# Requirements — Gestión de Usuarios y Roles

Referencia: `.claude/steering/security-roles.md`, `.claude/steering/subscriptions.md`.

## User Stories

### US-1: Listado de usuarios del negocio

Como `ADMIN_NEGOCIO`, quiero ver todos los usuarios de mi negocio para gestionar el equipo.

**Criterios de aceptación**

1. CUANDO `ADMIN_NEGOCIO` accede a `/usuarios`, EL SISTEMA DEBE listar todos los usuarios vinculados al negocio activo, con su rol y estado (activo/inactivo).
2. SI el rol del usuario autenticado no es `ADMIN_NEGOCIO`, ENTONCES EL SISTEMA DEBE denegar el acceso a esta vista (`403`).
3. EL SISTEMA DEBE mostrar, junto al listado, el uso actual vs. límite del plan (ej. "3 de 4 usuarios").

### US-2: Invitar/crear usuario

Como `ADMIN_NEGOCIO`, quiero invitar un nuevo usuario a mi negocio asignándole un rol.

**Criterios de aceptación**

1. CUANDO `ADMIN_NEGOCIO` invita un usuario nuevo por email con un rol, EL SISTEMA DEBE validar primero que no se exceda `planes.max_usuarios` del plan activo (ver `subscriptions.md`); SI se excede, DEBE rechazar con `403 PLAN_LIMIT_REACHED` sin crear nada.
2. CUANDO el email invitado no existe como usuario de plataforma, EL SISTEMA DEBE crear un registro de invitación pendiente y enviar un email con link de activación (definir contraseña + aceptar).
3. CUANDO el email invitado ya existe como usuario de plataforma (pertenece a otra cuenta o negocio), EL SISTEMA DEBE vincularlo al negocio con el rol indicado, sujeto a su confirmación por email (no se agrega sin consentimiento).
4. EL ROL asignable en la invitación DEBE ser uno de `MAYORDOMO`, `OPERARIO`, `VETERINARIO_EXTERNO` (no se puede invitar a otro `ADMIN_NEGOCIO`; ese rol es exclusivo del creador del negocio en v1).
5. CUANDO una invitación lleva más de 7 días sin aceptarse, EL SISTEMA DEBE permitir reenviarla o cancelarla desde el listado.

### US-3: Editar rol / desactivar usuario

Como `ADMIN_NEGOCIO`, quiero cambiar el rol de un usuario o desactivarlo si ya no forma parte del equipo.

**Criterios de aceptación**

1. CUANDO `ADMIN_NEGOCIO` cambia el rol de un usuario del negocio, EL SISTEMA DEBE aplicar el cambio inmediatamente; si el usuario tiene sesión activa, su próximo refresh de token DEBE reflejar el nuevo rol/permisos (el access token vigente puede tardar hasta su expiración natural en reflejarlo — máx. 15 min).
2. CUANDO `ADMIN_NEGOCIO` desactiva un usuario, EL SISTEMA DEBE revocar sus refresh tokens activos (fuerza logout) y ocultarlo de los selectores operativos, conservando su historial de registros (no se borran datos por integridad referencial/trazabilidad).
3. EL SISTEMA NO DEBE permitir que un `ADMIN_NEGOCIO` se desactive a sí mismo si es el único administrador del negocio.
4. UN USUARIO no `ADMIN_NEGOCIO` NO DEBE poder editar roles ni desactivar usuarios, ni siquiera a sí mismo.

### US-4: Vista de perfil de usuario (self-service)

Como usuario autenticado, quiero gestionar mis propios datos.

**Criterios de aceptación**

1. CUALQUIER usuario autenticado DEBE poder ver y editar su nombre, foto y cambiar su contraseña (requiere contraseña actual) desde `/perfil`.
2. UN USUARIO NO DEBE poder ver ni editar su propio rol o negocios asignados desde `/perfil` (solo lectura ahí).
3. CUANDO el usuario cambia su contraseña desde `/perfil`, EL SISTEMA DEBE aplicar las mismas reglas de complejidad que en registro y revocar las demás sesiones activas.
