# Requirements — Autenticación y Login

Referencia: `.claude/steering/security-roles.md`, `.claude/steering/subscriptions.md`.

## User Stories

### US-1: Login con email y contraseña

Como usuario registrado, quiero iniciar sesión con mi email y contraseña para acceder a mi(s) negocio(s).

**Criterios de aceptación (EARS)**

1. CUANDO el usuario envía email y contraseña válidos, EL SISTEMA DEBE autenticarlo y devolver un access token (JWT, exp ~15min) y setear un refresh token en cookie httpOnly + Secure + SameSite=Strict (exp ~7 días).
2. CUANDO el usuario envía credenciales inválidas, EL SISTEMA DEBE responder `401` con mensaje genérico "Email o contraseña incorrectos", sin indicar cuál campo es incorrecto.
3. CUANDO el usuario pertenece a más de un negocio (Plan 3), EL SISTEMA DEBE incluir en la respuesta de login la lista de negocios disponibles y seleccionar el último negocio activo usado (o el primero si no hay historial) como `tenantId` inicial del token.
4. CUANDO el email no está verificado, EL SISTEMA DEBE bloquear el login y responder `403 EMAIL_NOT_VERIFIED` con opción de reenviar verificación.
5. CUANDO la cuenta (`cuentas.estado`) está `suspendida` o `cancelada`, EL SISTEMA DEBE permitir el login pero el token emitido DEBE reflejar modo solo-lectura (claim `readonly: true`), consumido por el frontend para bloquear acciones de escritura.
6. SI se registran 5 intentos fallidos consecutivos para el mismo email en 15 minutos, ENTONCES EL SISTEMA DEBE bloquear intentos adicionales para ese email por 15 minutos y notificar por email al titular.
7. EL SISTEMA DEBE aplicar rate limiting adicional por IP (ej. 20 intentos/15min) independiente del bloqueo por email.

### US-2: Validaciones de formulario de login (frontend)

Como usuario, quiero recibir feedback inmediato si mis datos de login son inválidos antes de enviarlos al servidor.

**Criterios de aceptación**

1. CUANDO el campo email no tiene formato válido, EL SISTEMA DEBE mostrar el error en línea sin permitir el submit.
2. CUANDO el campo contraseña está vacío, EL SISTEMA DEBE mostrar el error en línea sin permitir el submit.
3. MIENTRAS la petición de login está en curso, EL SISTEMA DEBE deshabilitar el botón de submit y mostrar estado de carga, evitando doble envío.
4. CUANDO el servidor responde `401`, EL SISTEMA DEBE mostrar el mensaje de error genérico devuelto por el backend, sin loguearlo en consola con detalles sensibles.
5. EL SISTEMA DEBE ofrecer un toggle de "mostrar/ocultar contraseña".
6. EL SISTEMA DEBE ofrecer un link a "¿Olvidaste tu contraseña?" y a "Crear cuenta".

### US-3: Recuperación de contraseña

Como usuario que olvidó su contraseña, quiero poder restablecerla de forma segura.

**Criterios de aceptación**

1. CUANDO el usuario solicita recuperación con un email, EL SISTEMA DEBE responder siempre con el mismo mensaje de éxito exista o no el email (evita enumeración de usuarios), y SI el email existe, DEBE enviar un correo con un token de un solo uso válido por 30 minutos.
2. CUANDO el usuario abre el link con token válido y no expirado, EL SISTEMA DEBE permitir definir una nueva contraseña.
3. CUANDO el token está expirado o ya fue usado, EL SISTEMA DEBE rechazar con mensaje claro y ofrecer solicitar uno nuevo.
4. CUANDO se define una nueva contraseña exitosamente, EL SISTEMA DEBE invalidar todas las sesiones/refresh tokens activos del usuario y notificarle por email que su contraseña cambió.

### US-4: Registro de cuenta nueva (onboarding)

Como visitante, quiero crear una cuenta para empezar a usar el sistema.

**Criterios de aceptación**

1. CUANDO un visitante se registra con email, contraseña y nombre, EL SISTEMA DEBE crear `usuario`, `cuenta` (en `estado = periodo_prueba`) y un `negocio` inicial, asignando al usuario el rol `ADMIN_NEGOCIO` de ese negocio.
2. LA CONTRASEÑA DEBE cumplir: mínimo 8 caracteres, al menos una mayúscula, un número — validado en frontend y backend.
3. CUANDO el registro es exitoso, EL SISTEMA DEBE enviar email de verificación y permitir explorar la app en modo limitado (sin persistir datos operativos) hasta verificar, o bloquear acceso completo hasta verificación (**decisión de producto pendiente** — default: bloquear hasta verificar, más simple de implementar en v1).
4. CUANDO el email ya está registrado, EL SISTEMA DEBE rechazar con `409` y mensaje claro, sin revelar más datos de la cuenta existente.

### US-5: Sesión y logout

Como usuario autenticado, quiero que mi sesión se mantenga de forma segura y poder cerrarla.

**Criterios de aceptación**

1. CUANDO el access token expira, EL SISTEMA (frontend) DEBE intentar renovarlo automáticamente vía `/auth/refresh` usando el refresh token de la cookie, de forma transparente al usuario.
2. CUANDO el refresh token también es inválido/expirado, EL SISTEMA DEBE redirigir al login y limpiar el estado de sesión local.
3. CUANDO el usuario hace logout, EL SISTEMA DEBE invalidar el refresh token en backend (blacklist o rotación) y limpiar el estado local (Pinia, cookies).
4. EL SISTEMA DEBE ofrecer, desde "Mi perfil", la opción "Cerrar sesión en todos los dispositivos", que invalida todos los refresh tokens del usuario.
5. CADA USO de un refresh token DEBE rotarlo (invalidar el anterior, emitir uno nuevo); SI se detecta el uso de un refresh token ya rotado (reutilizado), ENTONCES EL SISTEMA DEBE invalidar toda la familia de tokens de esa sesión y forzar login (señal de robo de token).

### US-6: Cambio de negocio activo (Plan 3)

Como usuario con acceso a varios negocios, quiero cambiar el negocio activo sin volver a loguearme.

**Criterios de aceptación**

1. CUANDO el usuario selecciona otro negocio del selector de topbar, EL SISTEMA DEBE validar su pertenencia a ese negocio y emitir un nuevo access token con el `tenantId` actualizado.
2. CUANDO el cambio de negocio es exitoso, EL SISTEMA DEBE limpiar todo estado cacheado de datos operativos del negocio anterior antes de cargar el nuevo.
3. SI el usuario no pertenece al negocio solicitado, ENTONCES EL SISTEMA DEBE rechazar con `403`.

## Fuera de alcance de este spec

- Login social (Google/Facebook) — evaluado a futuro.
- Autenticación de dos factores (2FA) — modelo de datos deja espacio (`usuarios.two_factor_enabled`) pero no se implementa en v1.
