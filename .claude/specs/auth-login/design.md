# Design — Autenticación y Login

## Modelo de datos (extensión sobre `usuarios`)

```
usuarios
├── id                    UUID PK
├── email                 VARCHAR UNIQUE
├── password_hash         VARCHAR (argon2)
├── nombre                VARCHAR
├── email_verificado_en   TIMESTAMP NULL
├── two_factor_enabled    BOOLEAN DEFAULT false   -- reservado, no usado en v1
├── cuenta_id             UUID FK -> cuentas.id
├── ultimo_negocio_id     UUID FK -> negocios.id NULL
├── created_at / updated_at

tokens_recuperacion
├── id, usuario_id FK, token_hash, expira_en, usado_en NULL, created_at

refresh_tokens
├── id, usuario_id FK, token_hash, familia_id UUID, revocado_en NULL, expira_en, created_at
    -- familia_id agrupa la cadena de rotación de una misma sesión; permite invalidar toda la familia ante reuse detectado

intentos_login
├── id, email, ip, exitoso BOOLEAN, created_at   -- soporta rate limiting y auditoría
```

## Endpoints (NestJS — módulo `auth`)

| Método | Ruta | Guard | Descripción |
|---|---|---|---|
| POST | `/auth/registro` | público + throttle | Crea usuario, cuenta (trial), negocio inicial, rol ADMIN_NEGOCIO |
| POST | `/auth/login` | público + throttle | Valida credenciales, emite access+refresh |
| POST | `/auth/refresh` | público (valida cookie) | Rota refresh token, emite nuevo access token |
| POST | `/auth/logout` | JwtAuthGuard | Revoca refresh token actual |
| POST | `/auth/logout-all` | JwtAuthGuard | Revoca todos los refresh tokens del usuario |
| POST | `/auth/switch-tenant` | JwtAuthGuard | Emite nuevo access token con otro `tenantId` |
| GET | `/auth/me` | JwtAuthGuard | Usuario actual + rol + permisos + negocio activo |
| POST | `/auth/recuperar-password` | público + throttle | Genera token de recuperación, envía email |
| POST | `/auth/reset-password` | público | Valida token, actualiza password, revoca sesiones |
| POST | `/auth/verificar-email` | público | Valida token de verificación de email |
| POST | `/auth/reenviar-verificacion` | JwtAuthGuard o público con email | Reenvía email de verificación |

## Flujo de login (secuencia)

1. Frontend POST `/auth/login` con `{ email, password }`.
2. `AuthService.validateUser`: busca usuario por email, compara hash con argon2 (tiempo constante), incrementa/verifica `intentos_login`.
3. Si válido: verifica `email_verificado_en`, resuelve negocios del usuario (`usuario_negocio`), determina `tenantId` inicial (`ultimo_negocio_id` o el primero), resuelve rol y permisos de ese negocio, resuelve `estado` de la `cuenta` para el claim `readonly`.
4. Emite access token JWT (payload: `sub`, `tenantId`, `rol`, `readonly`, `exp` 15min) firmado con secret de entorno (`JWT_ACCESS_SECRET`).
5. Emite refresh token opaco (random 256-bit), lo hashea (SHA-256) y persiste en `refresh_tokens` con nueva `familia_id`; setea cookie httpOnly.
6. Responde `{ accessToken, usuario, negocios[], negocioActivo }`.

## Frontend — estructura

```
modules/auth/
├── views/
│   ├── LoginView.vue
│   ├── RegistroView.vue
│   ├── RecuperarPasswordView.vue
│   └── ResetPasswordView.vue
├── components/
│   ├── LoginForm.vue
│   ├── PasswordInput.vue          # con toggle mostrar/ocultar
│   └── TenantSwitcher.vue         # selector de negocio en topbar
├── composables/
│   └── useAuth.ts                 # login(), logout(), refresh(), switchTenant()
├── stores/
│   └── auth.store.ts              # Pinia: usuario, rol, negocioActivo, permisos, readonly
├── services/
│   └── auth.api.ts
└── validation/
    └── login.schema.ts            # Yup: email requerido+formato, password requerido
```

- `auth.store.ts` persiste solo lo no sensible en `localStorage` (ej. `negocioActivo.id` para preseleccionar en el próximo login); el access token vive solo en memoria (store), nunca en localStorage, para reducir superficie de robo vía XSS.
- Interceptor de Axios (`shared/api/http.ts`): en un `401` con código `TOKEN_EXPIRED`, encola la request, llama `/auth/refresh`, reintenta; si el refresh también falla, hace logout local y redirige a `/login`.
- `router/guards.ts`: `beforeEach` verifica `authStore.isAuthenticated`; si la ruta requiere permiso (`meta.permission`) y el usuario no lo tiene, redirige a `/403`. Rutas de `auth` (`/login`, `/registro`, etc.) son accesibles solo si NO hay sesión activa (si ya hay sesión, redirige a `/dashboard`).

## Seguridad

- Passwords con `argon2id`, parámetros mínimos recomendados OWASP (memory 19MB, iterations 2, parallelism 1 — ajustar según benchmark del hosting).
- Cookies de refresh: `httpOnly; Secure; SameSite=Strict; Path=/auth`.
- CORS restringido a los orígenes conocidos (web app, y esquema custom de Capacitor en móvil).
- Todas las rutas de `auth` bajo `@nestjs/throttler` con límites definidos en `requirements.md`.
- Logs de `intentos_login` no deben persistir la contraseña en ningún caso, ni en logs de aplicación.
