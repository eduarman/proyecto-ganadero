# Tasks — Autenticación y Login

## Backend

- [ ] 1. Modelar en Prisma: `usuarios`, `tokens_recuperacion`, `refresh_tokens`, `intentos_login`, `cuentas`, `negocios`, `usuario_negocio` (coordinar con `suscripciones-negocios`).
- [ ] 2. Implementar `AuthModule`: `AuthService`, `AuthController`, DTOs (`LoginDto`, `RegistroDto`, `ResetPasswordDto`) con `class-validator`.
- [ ] 3. Implementar hashing de contraseña con argon2 (`argon2id`) y servicio de comparación en tiempo constante.
- [ ] 4. Implementar emisión y verificación de JWT de acceso (`JwtStrategy`, `JwtAuthGuard`).
- [ ] 5. Implementar refresh token opaco con rotación y detección de reuse (familia de tokens).
- [ ] 6. Implementar `POST /auth/login` con lógica de US-1 (incluye resolución de negocios, rol, `readonly`).
- [ ] 7. Implementar `POST /auth/registro` con creación transaccional de usuario+cuenta+negocio+rol.
- [ ] 8. Implementar rate limiting (`@nestjs/throttler`) por IP y bloqueo por email vía `intentos_login`.
- [ ] 9. Implementar `POST /auth/recuperar-password` y `POST /auth/reset-password` con tokens de un solo uso.
- [ ] 10. Implementar verificación de email (`POST /auth/verificar-email`, `POST /auth/reenviar-verificacion`).
- [ ] 11. Implementar `POST /auth/switch-tenant` validando pertenencia vía `usuario_negocio`.
- [ ] 12. Implementar `GET /auth/me` devolviendo usuario, rol, permisos resueltos, negocio activo.
- [ ] 13. Implementar `POST /auth/logout` y `POST /auth/logout-all`.
- [ ] 14. Integrar envío de emails transaccionales (verificación, recuperación, alerta de bloqueo, alerta de cambio de password).
- [ ] 15. Tests unitarios de `AuthService` (casos de US-1 a US-6) y tests e2e de los endpoints principales.

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
