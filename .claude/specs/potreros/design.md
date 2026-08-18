# Design — Potreros

## Modelo de datos

```
potreros
├── id, tenant_id
├── nombre              VARCHAR   -- UNIQUE (tenant_id, nombre)
├── area_hectareas       DECIMAL
├── tipo_pasto           VARCHAR NULL
├── capacidad_carga      DECIMAL NULL   -- UGG/ha o animales/ha, unidad configurable a nivel negocio
├── geolocalizacion      GEOMETRY(Polygon, 4326) NULL   -- PostGIS; NULL si no se cargó mapa
├── estado               ENUM(activo, inactivo)
├── created_at / updated_at
```

La ocupación actual, historial de rotación y días de descanso **no se persisten** como columnas — se derivan en tiempo de consulta a partir de `animales.potrero_actual_id` y `animal_movimientos` (módulo `ganado`), evitando datos duplicados/desincronizados. Si el volumen lo justifica más adelante, se puede materializar en una vista o tabla de agregación, pero no en v1.

## Endpoints (módulo `potreros`)

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/potreros` | `potreros:view` | Lista con ocupación actual calculada |
| GET | `/potreros/:id` | `potreros:view` | Detalle + historial de rotación |
| POST | `/potreros` | `potreros:create` | Alta |
| PATCH | `/potreros/:id` | `potreros:update` | Editar |
| PATCH | `/potreros/:id/inactivar` | `potreros:update` | Inactivar (valida sin animales asignados) |
| GET | `/potreros/:id/historial-rotacion` | `potreros:view` | Periodos de ocupación derivados de `animal_movimientos` |
| GET | `/potreros/mapa` | `potreros:view` | GeoJSON de todos los potreros con geolocalización del negocio |

El endpoint de movimiento de animales (`POST /ganado/movimientos`, definido en el spec `ganado`) es quien consulta a `PotrerosService.validarCapacidad(potreroDestinoId, cantidadNueva)` para devolver la advertencia de sobrecarga (US-2.2) — la lógica de capacidad vive en `potreros`, pero se invoca desde `ganado`.

## Frontend

```
modules/potreros/
├── views/
│   ├── ListaPotrerosView.vue      # tabla con badge de ocupación (normal/cerca límite/sobrecargado)
│   ├── DetallePotreroView.vue     # datos + historial de rotación
│   └── MapaPotrerosView.vue       # mapa con todos los potreros geolocalizados
├── components/
│   ├── PotreroForm.vue
│   ├── PotreroMapEditor.vue       # dibujo de polígono (librería de mapas, ej. Leaflet)
│   └── OcupacionBadge.vue
├── composables/
│   └── usePotreros.ts
└── services/
    └── potreros.api.ts
```

- Librería de mapas: Leaflet (liviana, sin costo de licencia, buen soporte en Capacitor/móvil vía WebView) en vez de Google Maps, para no atar el proyecto a una API key de pago desde el inicio.
- `OcupacionBadge.vue` centraliza la lógica visual de umbral (normal/cerca del límite/sobrecargado) para reutilizarse también en `dashboard`.
