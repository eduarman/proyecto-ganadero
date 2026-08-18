# Design — Gestión del Ganado

## Modelo de datos

```
animales
├── id                UUID PK
├── tenant_id         UUID FK -> negocios.id (indexado)
├── identificador     VARCHAR           -- UNIQUE (tenant_id, identificador)
├── especie           ENUM(bovino, bufalino)
├── sexo              ENUM(macho, hembra)
├── fecha_nacimiento  DATE NULL
├── categoria         VARCHAR NULL      -- editable manual, sugerida por cálculo
├── raza              VARCHAR NULL
├── color             VARCHAR NULL
├── peso_nacimiento   DECIMAL NULL
├── madre_id          UUID FK -> animales.id NULL
├── padre_id          UUID FK -> animales.id NULL
├── madre_ref_externa VARCHAR NULL      -- si el padre/madre no está en el sistema
├── padre_ref_externa VARCHAR NULL
├── foto_url          VARCHAR NULL
├── potrero_actual_id UUID FK -> potreros.id NULL
├── estado            ENUM(activo, vendido, muerto, en_transito, inactivo)
├── created_at / updated_at

animal_movimientos
├── id, tenant_id, animal_id FK, potrero_origen_id NULL, potrero_destino_id FK
├── fecha, usuario_id FK, created_at

animal_bajas
├── id, tenant_id, animal_id FK, motivo ENUM(venta, muerte, traslado, otro)
├── fecha, observaciones, usuario_id FK, created_at
```

Índices clave: `(tenant_id, identificador)` UNIQUE, `(tenant_id, potrero_actual_id)`, `(tenant_id, estado)`.

## Endpoints (módulo `ganado`)

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/ganado` | `ganado:view` | Listado paginado + filtros (potrero, categoría, sexo, estado, edad) |
| GET | `/ganado/:id` | `ganado:view` | Ficha del animal (datos base; el resto se compone en frontend vía llamadas a otros módulos) |
| POST | `/ganado` | `ganado:create` | Alta de animal |
| PATCH | `/ganado/:id` | `ganado:update` | Editar datos |
| POST | `/ganado/:id/baja` | `ganado:delete` (semántica de baja, no DELETE físico) | Registrar baja |
| POST | `/ganado/movimientos` | `ganado:update` | Mover animal(es) de potrero (acepta `animalIds[]`) |
| GET | `/ganado/:id/movimientos` | `ganado:view` | Historial de ubicaciones |
| POST | `/ganado/importar` | `ganado:create` | Importación CSV/Excel, respuesta con resumen éxitos/errores por fila |
| GET | `/ganado/plantilla-importacion` | `ganado:view` | Descarga plantilla CSV |

No hay `DELETE /ganado/:id` físico expuesto en v1 — la baja es el mecanismo estándar; borrado físico (si se necesitara por error de carga) queda como operación interna vía soporte, no endpoint público.

## Frontend

```
modules/ganado/
├── views/
│   ├── ListaGanadoView.vue         # tabla paginada + filtros + búsqueda
│   ├── DetalleAnimalView.vue       # ficha con tabs: General | Reproducción | Producción | Sanidad | Movimientos
│   ├── NuevoAnimalView.vue
│   └── ImportarGanadoView.vue
├── components/
│   ├── AnimalFiltros.vue
│   ├── AnimalForm.vue              # reutilizado en Nuevo y Editar
│   ├── MoverAnimalesModal.vue      # selección múltiple + potrero destino
│   ├── DarDeBajaModal.vue
│   └── GenealogiaTree.vue
├── composables/
│   └── useGanado.ts
├── stores/
│   └── ganado.store.ts             # cache de catálogo liviano (id, identificador) para selectores en otros módulos
└── services/
    └── ganado.api.ts
```

- `DetalleAnimalView.vue` compone tabs que internamente llaman a `reproduccion.api.ts`, `produccion.api.ts`, `sanidad.api.ts` filtrando por `animalId` — el módulo `ganado` no conoce el detalle interno de esos módulos, solo pasa el id.
- `ganado.store.ts` expone un catálogo liviano (`{ id, identificador, potreroActual }[]`) cacheado y usado por selectores de animal en `reproduccion`, `produccion`, `sanidad` para evitar refetch repetido.
- La categoría etaria sugerida se calcula en un composable puro `useCategoriaEtaria(fechaNacimiento, sexo, especie)` compartido entre frontend (preview inmediato) y como referencia de la misma lógica implementada en backend (fuente de verdad al guardar).
