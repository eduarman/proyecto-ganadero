# Stack Técnico

## Decisión general

Monorepo con frontend Vue 3 (web + móvil vía Capacitor) y backend NestJS como API REST, PostgreSQL como base de datos. Arquitectura API-first: el backend no renderiza vistas, todo el consumo es vía API HTTP (JSON), consumida igual por web y móvil.

## Frontend (web + móvil)

- **Vue 3** (Composition API + `<script setup>`) — no Options API salvo justificación puntual.
- **Vite** como bundler/dev server.
- **Bootstrap 5** (última versión) para el sistema de componentes base, importado como SCSS (no el bundle JS de Bootstrap; los componentes interactivos se implementan en Vue).
- **SCSS** para theming: variables de Bootstrap sobreescritas en `styles/_variables.scss`, sin editar el core de Bootstrap.
- **Pinia** para estado global (auth/sesión, usuario actual, negocio/tenant activo, catálogos cacheados).
- **Vue Router 4** con guards de navegación (autenticación + autorización por rol/permiso, ver `security-roles.md`).
- **Axios** con interceptores (adjuntar JWT, refresh automático, manejo centralizado de errores 401/403).
- **VeeValidate + Yup** (o Zod) para validación de formularios en cliente, con mensajes de error consistentes.
- **Capacitor** para empaquetar la misma app Vue como app nativa Android/iOS. Un solo codebase (`apps/web`), el build de Capacitor consume el mismo `dist/`. Plugins nativos (cámara, geolocalización, notificaciones push) se agregan bajo demanda, siempre con un fallback web funcional.
- **Chart.js (vue-chartjs)** para gráficos de dashboard y reportes.

## Backend

- **NestJS** (TypeScript) como framework de API REST.
- **Prisma ORM** sobre PostgreSQL (preferido sobre TypeORM por DX, migraciones declarativas y type-safety end-to-end).
- **PostgreSQL 16+** como base de datos primaria. Extensión **PostGIS** habilitada para geolocalización de potreros (polígonos/puntos).
- **Autenticación**: JWT (access token corto ~15min + refresh token httpOnly cookie), `@nestjs/passport` con estrategia JWT.
- **Autorización**: Guards de NestJS (`RolesGuard`, `PermissionsGuard`) + decoradores custom (`@Roles()`, `@RequirePermission()`) evaluados por request, más un `TenantGuard` que resuelve y valida el `tenant_id` (negocio activo) en cada request. Ver `security-roles.md`.
- **Validación**: `class-validator` + `class-transformer` en DTOs de entrada, rechazo temprano (400) antes de llegar a lógica de negocio.
- **Módulo de suscripciones**: capa de dominio propia que valida límites de plan (usuarios, negocios) antes de permitir altas; no delega esta validación al frontend.
- **Colas/jobs**: BullMQ + Redis para tareas asíncronas (alertas de vacunación próximas a vencer, recordatorios de celo esperado, generación de reportes pesados, envío de emails).
- **Emails**: proveedor transaccional (ej. Resend o SES) para verificación de cuenta, recuperación de contraseña, notificaciones de suscripción.
- **Reportes exportables**: generación de PDF (ej. Puppeteer o pdf-lib) y Excel (ej. exceljs) desde el backend, no en el cliente.
- **Documentación de API**: Swagger/OpenAPI autogenerado (`@nestjs/swagger`) desde los DTOs y controllers.

## Base de datos

- PostgreSQL como única fuente de verdad, modelo relacional (ver justificación de multi-tenancy en `subscriptions.md`).
- Migraciones versionadas con Prisma Migrate, commiteadas al repo.
- Estrategia de multi-tenancy: **shared database, `tenant_id` (negocio_id) por fila** en todas las tablas de negocio (no en tablas globales como `users` de plataforma o `planes`). Row Level Security (RLS) de Postgres como capa adicional de defensa, además de la validación en el ORM/backend.
- Backups automáticos diarios + point-in-time recovery (según proveedor de hosting elegido).

## Infraestructura y DevOps

- **Monorepo** gestionado con pnpm workspaces (o Turborepo si el equipo crece) — ver `structure.md`.
- **Docker** para desarrollo local (docker-compose: postgres, redis, api) y como artefacto de despliegue del backend.
- **CI**: lint + typecheck + tests en cada PR (GitHub Actions).
- **Hosting sugerido** (a confirmar según presupuesto): backend en un PaaS con soporte Docker (Railway, Render o similar) o VPS propio; frontend web como estático en un CDN (Vercel/Netlify/Cloudflare Pages); PostgreSQL gestionado (Supabase, Neon o RDS).
- **Variables de entorno**: nunca hardcodear secretos; `.env` por entorno, gestionadas fuera del repo en producción.

## Testing

- **Backend**: Jest (unit tests de services/guards) + tests e2e de NestJS contra una base de datos de test.
- **Frontend**: Vitest (unit de composables/stores) + Vue Test Utils (componentes) + Playwright para e2e críticos (login, alta de animal, flujo de suscripción).

## Convenciones de código

- TypeScript estricto (`strict: true`) en frontend y backend, sin `any` salvo justificación.
- ESLint + Prettier compartidos entre frontend y backend vía config en `packages/config` (ver `structure.md`).
- Nomenclatura de dominio en español para entidades de negocio visibles al usuario (ej. `potrero`, `sanidad`, `hato`) pero código (variables, clases) en inglés siguiendo convención estándar, salvo términos de dominio sin traducción natural (ej. `finca`, `potrero`) que se mantienen en español para no perder claridad de dominio.
