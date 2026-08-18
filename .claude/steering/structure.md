# Estructura del Proyecto

## Monorepo

```
proyecto-ganadero/
├── .claude/
│   ├── steering/              # Este directorio: visión de producto y decisiones técnicas transversales
│   └── specs/                 # Specs por módulo: requirements.md, design.md, tasks.md
├── apps/
│   ├── web/                   # App Vue 3 + Vite (web y base para móvil vía Capacitor)
│   │   ├── src/
│   │   │   ├── modules/       # Un subdirectorio por módulo funcional (ver abajo)
│   │   │   ├── router/
│   │   │   ├── stores/        # Pinia stores globales (auth, tenant activo, ui)
│   │   │   ├── shared/        # Componentes, composables y utils reutilizables entre módulos
│   │   │   ├── layouts/       # Layouts (AuthLayout, AppLayout con sidebar/topbar)
│   │   │   ├── styles/        # SCSS: _variables.scss (overrides Bootstrap), main.scss
│   │   │   ├── App.vue
│   │   │   └── main.ts
│   │   ├── capacitor.config.ts
│   │   └── vite.config.ts
│   └── api/                   # Backend NestJS
│       ├── src/
│       │   ├── modules/       # Un módulo Nest por dominio (ver mapeo abajo)
│       │   ├── common/        # Guards, decorators, filters, interceptors, pipes compartidos
│       │   ├── prisma/        # PrismaService + schema.prisma
│       │   └── main.ts
│       └── test/
├── packages/
│   ├── shared-types/          # Tipos/DTOs/enums compartidos entre api y web (contratos de API)
│   └── config/                # ESLint, Prettier, tsconfig base compartidos
├── docker-compose.yml         # postgres, redis, api (desarrollo local)
├── pnpm-workspace.yaml
└── README.md
```

## Mapeo de módulos funcionales → carpetas

Cada módulo funcional del producto (ver `product.md`) tiene su contraparte tanto en frontend como en backend, con nombres consistentes:

| Módulo funcional | `apps/web/src/modules/` | `apps/api/src/modules/` |
|---|---|---|
| Autenticación / Login | `auth/` | `auth/` |
| Usuarios y roles | `usuarios/` | `usuarios/` |
| Suscripciones y negocios | `suscripciones/` | `suscripciones/`, `negocios/` |
| Panel general | `dashboard/` | `dashboard/` (agregaciones de solo-lectura) |
| Gestión del ganado | `ganado/` | `ganado/` |
| Eventos reproductivos | `reproduccion/` | `reproduccion/` |
| Potreros | `potreros/` | `potreros/` |
| Alimentación | `alimentacion/` | `alimentacion/` |
| Producción | `produccion/` | `produccion/` |
| Sanidad | `sanidad/` | `sanidad/` |
| Reportes | `reportes/` | `reportes/` |

## Estructura interna de un módulo frontend

```
modules/ganado/
├── views/              # Vistas ruteadas (ListaGanadoView.vue, DetalleAnimalView.vue)
├── components/         # Componentes específicos del módulo (no reutilizables fuera de él)
├── composables/        # Lógica reutilizable del módulo (useAnimales.ts)
├── stores/             # Pinia store del módulo si aplica (ganadoStore.ts)
├── services/           # Llamadas a API específicas del módulo (ganado.api.ts)
└── types.ts            # Tipos específicos del módulo (o importados de packages/shared-types)
```

## Estructura interna de un módulo backend (Nest)

```
modules/ganado/
├── ganado.module.ts
├── ganado.controller.ts
├── ganado.service.ts
├── dto/                 # CreateAnimalDto, UpdateAnimalDto, etc. (con class-validator)
└── entities/             # Tipos de dominio si no se usa directamente el modelo Prisma
```

## Reglas de organización

- Ningún componente de vista accede directamente a `axios`; siempre pasa por `services/*.api.ts` del módulo, que a su vez usa la instancia de Axios configurada en `shared/api/http.ts`.
- La validación de permisos en frontend (mostrar/ocultar UI) vive en `shared/composables/usePermissions.ts` y se consume desde componentes y desde los guards de router — nunca se duplica la lógica de "qué puede ver este rol" en cada componente.
- Todo endpoint nuevo en `apps/api` debe declarar explícitamente sus guards (`@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)`) — no hay endpoints "abiertos por omisión" salvo los listados en `auth` (login, refresh, recuperación de contraseña).
- Los DTOs de request/response que se comparten conceptualmente entre frontend y backend se definen una sola vez en `packages/shared-types` para evitar divergencia de contratos.
- Cada spec en `.claude/specs/<modulo>/` debe mapear 1:1 con un módulo funcional de esta tabla; si una feature no encaja en un módulo existente, se decide explícitamente si es un módulo nuevo o parte de uno existente antes de escribir la spec.
