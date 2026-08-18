# Design — Reportes

## Enfoque

El módulo `reportes` no duplica datos: consulta (vía servicios internos, no HTTP) a los módulos `ganado`, `reproduccion`, `potreros`, `alimentacion`, `produccion`, `sanidad` para componer agregaciones. Es una capa de composición + exportación, no una fuente de datos propia (excepto metadatos de jobs de exportación).

## Modelo de datos

```
reportes_generados
├── id, tenant_id, tipo VARCHAR, filtros_json JSONB
├── formato ENUM(pdf, xlsx), estado ENUM(pendiente, generando, listo, error)
├── archivo_url VARCHAR NULL, solicitado_por FK -> usuarios.id
├── created_at, completado_en NULL
```

Los archivos generados se almacenan en storage de objetos (ej. S3-compatible) con URL firmada de expiración corta, no en el servidor de aplicación.

## Endpoints (módulo `reportes`)

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/reportes/tipos` | `reportes:view` | Catálogo de reportes disponibles según rol/plan |
| POST | `/reportes/:tipo/generar` | `reportes:view` + permiso del módulo origen | Encola generación (`reportes_generados`), responde `id` |
| GET | `/reportes/generados/:id` | `reportes:view` | Estado y, si `listo`, URL de descarga |
| GET | `/reportes/generados` | `reportes:view` | Historial de reportes generados por el usuario/negocio |
| POST | `/reportes/consolidado` | `Roles(ADMIN_NEGOCIO)` + plan Plan 3 | Reporte cruzando todos los negocios de la cuenta |

Tipos soportados en v1 (`tipo` en `/reportes/:tipo/generar`): `inventario_ganado`, `natalidad_mortalidad`, `produccion`, `costos_alimentacion`, `cumplimiento_sanitario`, `ocupacion_potreros`, `costo_vs_produccion` (cruzado).

## Flujo de generación asíncrona

```
POST /reportes/produccion/generar { filtros, formato }
  → crea `reportes_generados` (estado: pendiente)
  → encola job BullMQ `generar-reporte`
  → responde 202 { id }

Worker `generar-reporte`:
  → estado = generando
  → ReportesService.obtenerDatos(tipo, filtros, tenantId)  -- delega a services de cada módulo
  → ExportService.render(formato, datos)  -- Puppeteer (PDF) o exceljs (XLSX)
  → sube archivo a storage, obtiene URL firmada
  → estado = listo, archivo_url = ...
```

Reportes pequeños (rango corto, pocos animales) pueden resolverse igual de forma síncrona internamente por el worker en segundos — la interfaz async es uniforme para todos los tamaños, evita tener dos code paths distintos en frontend.

## Frontend

```
modules/reportes/
├── views/
│   ├── CatalogoReportesView.vue     # cards por tipo de reporte disponible según rol/plan
│   ├── GenerarReporteView.vue       # formulario de filtros específico por tipo
│   └── HistorialReportesView.vue    # reportes generados, estado, descarga
├── components/
│   ├── FiltrosReporteForm.vue       # rango de fechas + potrero/lote + (Plan 3) selector de negocio/consolidado
│   ├── ReporteEstadoBadge.vue
│   └── graficos/                    # componentes de chart reutilizados también en dashboard
│       ├── CostoVsProduccionChart.vue
│       └── ComparativoPotrerosChart.vue
├── composables/
│   └── useReportes.ts               # incluye polling simple de estado mientras `generando`
└── services/
    └── reportes.api.ts
```

- `CatalogoReportesView.vue` filtra las cards mostradas según `usePermissions().can(...)` y, para el reporte consolidado, según `plan === 'plan3'`.
- `useReportes.ts` hace polling corto (ej. cada 3s) de `GET /reportes/generados/:id` mientras el estado sea `pendiente|generando`; se detiene al llegar a `listo|error`.
