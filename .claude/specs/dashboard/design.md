# Design — Panel General (Dashboard)

## Enfoque

El módulo `dashboard` es puramente de agregación/lectura — no tiene tablas propias ni operaciones de escritura. Compone datos de `ganado`, `potreros`, `produccion`, `sanidad`, `reproduccion` mediante llamadas internas a sus services (no HTTP), en un único endpoint para minimizar round-trips desde el frontend.

## Endpoint (módulo `dashboard`)

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/dashboard/resumen` | `dashboard:view` | Payload agregado único: KPIs, alertas, series para gráficos, filtrado según permisos del rol solicitante |

Estructura de respuesta (simplificada):

```jsonc
{
  "kpis": {
    "totalAnimales": 120,
    "animalesPorCategoria": { "vaca": 60, "novillo": 30, "ternero": 30 },
    "ocupacionPotreros": { "normal": 5, "cercaLimite": 2, "sobrecargado": 1 },
    "produccionReciente": { "litrosPromedioDia": 8.4, "periodo": "ultimos_30_dias" }
  },
  "alertas": [
    { "tipo": "sanidad_vencida", "cantidad": 3, "urgencia": "alta", "linkTo": "/sanidad/alertas" },
    { "tipo": "parto_proximo", "cantidad": 5, "urgencia": "media", "linkTo": "/reproduccion/calendario" }
  ],
  "tendencias": {
    "produccion30d": [ /* serie para chart */ ],
    "natalidadMortalidad": [ /* serie para chart */ ]
  }
}
```

`DashboardService.obtenerResumen(tenantId, usuario)` arma este payload filtrando secciones según la matriz de permisos del rol (ej. omite `produccionReciente` con detalle de costos si el rol no tiene `alimentacion:view-costos`), evitando que el frontend reciba datos que igual debería ocultar.

## Frontend

```
modules/dashboard/
├── views/
│   └── DashboardView.vue         # layout de KPI cards + alertas + gráficos, responsive (grid Bootstrap)
├── components/
│   ├── KpiCard.vue
│   ├── AlertasPanel.vue          # lista de alertas con link directo a la acción
│   └── TendenciasSection.vue     # reutiliza componentes de chart de modules/reportes/components/graficos
├── composables/
│   └── useDashboard.ts
└── services/
    └── dashboard.api.ts
```

- `DashboardView.vue` es la ruta raíz autenticada (`/dashboard`, redirect por defecto tras login).
- Se recarga completo (`useDashboard().cargar()`) en el evento de cambio de negocio activo emitido por `auth.store.ts` (watch sobre `negocioActivo.id`), cumpliendo US-4.1.
- Los `KpiCard.vue` visibles se filtran en frontend según `usePermissions()` como capa adicional de UX, aunque el backend ya omite los datos sensibles (defensa en profundidad consistente con `security-roles.md`).
