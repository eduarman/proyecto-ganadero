# Design — Alimentación

## Modelo de datos

```
insumos_alimentacion
├── id, tenant_id, nombre, unidad_medida VARCHAR, costo_unitario DECIMAL NULL
├── estado ENUM(activo, inactivo), created_at

planes_alimentacion
├── id, tenant_id, nombre, tipo ENUM(pastoreo, suplementacion, estabulado, mixto)
├── estado ENUM(activo, inactivo), created_at

plan_alimentacion_items
├── id, plan_id FK, insumo_id FK, cantidad DECIMAL, unidad_tiempo ENUM(dia, semana), por ENUM(animal, lote)

plan_asignaciones
├── id, tenant_id, plan_id FK
├── potrero_id FK NULL, animal_ids UUID[] NULL   -- una asignación apunta a potrero O a un lote de animales explícito
├── fecha_inicio, fecha_fin NULL, created_at

suministros
├── id, tenant_id, fecha, insumo_id FK
├── potrero_id FK NULL, animal_ids UUID[] NULL
├── cantidad DECIMAL, es_recurrente BOOLEAN DEFAULT false, recurrencia_id UUID NULL
├── registrado_por FK -> usuarios.id, created_at

suministros_recurrentes
├── id, tenant_id, insumo_id FK, potrero_id FK NULL, animal_ids UUID[] NULL
├── cantidad DECIMAL, frecuencia ENUM(diaria, semanal), activo BOOLEAN, fecha_inicio, fecha_fin NULL
```

`suministros_recurrentes` es procesado por un job diario (BullMQ) que genera la fila correspondiente en `suministros` para la fecha del día, con `recurrencia_id` apuntando al origen — permite editar/cancelar la recurrencia sin tocar el histórico ya generado.

## Endpoints (módulo `alimentacion`)

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET/POST/PATCH | `/alimentacion/insumos` | `alimentacion:*` | Catálogo de insumos (inactivar, no eliminar si está en uso) |
| GET/POST/PATCH | `/alimentacion/planes` | `alimentacion:*` | CRUD de planes |
| POST | `/alimentacion/planes/:id/asignaciones` | `alimentacion:update` | Asignar plan a potrero/lote |
| GET | `/alimentacion/suministros` | `alimentacion:view` | Listado filtrable por fecha/potrero/animal |
| POST | `/alimentacion/suministros` | `alimentacion:create` | Registro manual |
| POST | `/alimentacion/suministros/recurrentes` | `alimentacion:create` | Crear regla recurrente |
| PATCH | `/alimentacion/suministros/recurrentes/:id` | `alimentacion:update` | Editar/cancelar recurrencia |
| GET | `/alimentacion/costos` | `alimentacion:view` (solo roles con visibilidad de costos, ver `security-roles.md`) | Agregación de costo por periodo/potrero/lote |

## Frontend

```
modules/alimentacion/
├── views/
│   ├── InsumosView.vue
│   ├── PlanesAlimentacionView.vue
│   └── RegistroSuministrosView.vue
├── components/
│   ├── InsumoForm.vue
│   ├── PlanAlimentacionForm.vue          # items dinámicos (insumo + cantidad)
│   ├── AsignarPlanModal.vue
│   ├── RegistrarSuministroForm.vue
│   └── SuministroRecurrenteForm.vue
├── composables/
│   └── useAlimentacion.ts
└── services/
    └── alimentacion.api.ts
```

- La visibilidad de costos (`OcupacionBadge`-like gating) se resuelve con `can('alimentacion:view-costos')`, un permiso específico dentro del módulo — permite que `OPERARIO` registre suministros sin ver el costo asociado, cumpliendo la matriz de `security-roles.md`.
