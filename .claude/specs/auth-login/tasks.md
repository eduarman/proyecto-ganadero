# Tasks — Autenticación y Login

## Backend

> **Avance 2026-08-18:** scaffold de `apps/api` (NestJS + Prisma + PostgreSQL) creado desde cero, con el módulo `auth` completo (ítems 1-13). Detalle y decisiones de scope en el plan de esa sesión. Pendiente de verificar end-to-end: requiere Docker (o Postgres local) para correr `prisma migrate dev` y levantar el servidor contra una BD real — no disponible en el entorno donde se implementó.

- [x] 1. Modelar en Prisma: `usuarios`, `tokens_recuperacion`, `refresh_tokens`, `intentos_login`, `cuentas`, `negocios`, `usuario_negocio` (coordinar con `suscripciones-negocios`). Se agregó además `tokens_verificacion_email` (no listada en `design.md` original, necesaria para los endpoints de verificación).
- [x] 2. Implementar `AuthModule`: `AuthService`, `AuthController`, DTOs (`LoginDto`, `RegistroDto`, `ResetPasswordDto`, más `RecuperarPasswordDto`/`VerificarEmailDto`/`ReenviarVerificacionDto`/`SwitchTenantDto`) con `class-validator`.
- [x] 3. Implementar hashing de contraseña con argon2 (`argon2id`) y servicio de comparación en tiempo constante (`PasswordService`).
- [x] 4. Implementar emisión y verificación de JWT de acceso (`JwtStrategy`, `JwtAuthGuard`).
- [x] 5. Implementar refresh token opaco con rotación y detección de reuse (familia de tokens) — `RefreshTokenService`.
- [x] 6. Implementar `POST /auth/login` con lógica de US-1 (incluye resolución de negocios, rol, `readonly`).
- [x] 7. Implementar `POST /auth/registro` con creación transaccional de usuario+cuenta+negocio+rol.
- [x] 8. Implementar rate limiting (`@nestjs/throttler`) por IP y bloqueo por email vía `intentos_login`.
- [x] 9. Implementar `POST /auth/recuperar-password` y `POST /auth/reset-password` con tokens de un solo uso.
- [x] 10. Implementar verificación de email (`POST /auth/verificar-email`, `POST /auth/reenviar-verificacion`).
- [x] 11. Implementar `POST /auth/switch-tenant` validando pertenencia vía `usuario_negocio`.
- [x] 12. Implementar `GET /auth/me` devolviendo usuario, rol, negocio activo. **Permisos resueltos queda pendiente** (`permisos: []`) hasta que exista el catálogo `permisos`/`rol_permisos` del spec `usuarios-roles`.
- [x] 13. Implementar `POST /auth/logout` y `POST /auth/logout-all`.
- [ ] 14. Integrar envío de emails transaccionales (verificación, recuperación, alerta de bloqueo, alerta de cambio de password). Implementado como puerto `EmailSender` con una implementación de consola (`ConsoleEmailSender`) para dev — falta conectar un proveedor real (Resend/SES) y BullMQ/Redis para envío asíncrono (decisión explícita, ver `.claude/steering/tech.md`).
- [ ] 15. Tests unitarios de `AuthService`: cubiertos los casos núcleo de US-1 (login), US-3 (reset) y US-5 (refresh/reuse) en `auth.service.spec.ts`. **Faltan**: tests de switch-tenant, verificación de email, y tests e2e de los endpoints principales.

## Frontend

> **Avance 2026-08-09:** primera pasada de UI implementada en `apps/web` a partir del proyecto de Claude Design, con datos/flujo mock (sin backend real todavía) — ver memoria `project-frontend-v1`. `LoginView.vue` (`modules/auth/views/`) ya existe con validación real (Yup: email + password requeridos) y layouts responsivos (`AuthLayout.vue` desktop / `MobileAuthLayout.vue` mobile), pero como componente único (no separado en `LoginForm.vue`) y el submit solo simula login (`authStore.login()` local) en vez de llamar a `/auth/login`. Ítem 18 (`PasswordInput.vue`) quedó completo tal cual está descrito.

- [ ] 16. Crear `modules/auth` con estructura de `design.md`.
- [ ] 17. Implementar `LoginView.vue` + `LoginForm.vue` con validación Yup (US-2).
- [x] 18. Implementar `PasswordInput.vue` reutilizable con toggle mostrar/ocultar.
- [ ] 19. Implementar `auth.store.ts` (Pinia) y `useAuth.ts`.
- [ ] 20. Implementar interceptor de Axios con refresh automático transparente.
- [ ] 21. Implementar `RegistroView.vue` con validaciones de US-4.
- [ ] 22. Implementar `RecuperarPasswordView.vue` y `ResetPasswordView.vue`.
- [ ] 23. Implementar `TenantSwitcher.vue` en topbar (solo visible si el usuario tiene >1 negocio).
- [ ] 24. Implementar `router/guards.ts` con verificación de sesión y permisos por ruta.
- [ ] 25. Implementar vista `/403` de no autorizado y manejo de banner de modo solo-lectura (`readonly`).
- [ ] 26. Tests con Vitest de `auth.store.ts` y `useAuth.ts`; test e2e Playwright del flujo login→dashboard→logout.

## Dependencias

- Bloqueante para: todos los demás módulos (requieren sesión y permisos resueltos).
- Depende de: modelo de datos de `suscripciones-negocios` (tablas `cuentas`, `negocios`, `usuario_negocio`) debe definirse en conjunto.
