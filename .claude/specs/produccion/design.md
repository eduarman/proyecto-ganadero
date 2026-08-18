# Design — Producción

## Modelo de datos

```
-- configuración en tabla `negocios` o tabla 1:1 `configuracion_negocio`
negocios.orientacion_productiva  ENUM(leche, carne, doble_proposito)

registros_leche
├── id, tenant_id, animal_id FK, fecha, turno ENUM(manana, tarde, unico)
├── litros DECIMAL, registrado_por FK, created_at
├── UNIQUE (tenant_id, animal_id, fecha, turno)   -- evita doble carga accidental

registros_peso
├── id, tenant_id, animal_id FK, fecha, peso_kg DECIMAL
├── registrado_por FK, created_at
├── UNIQUE (tenant_id, animal_id, fecha)
```

GDP (ganancia diaria de peso) **no se persiste**: se calcula en query/servicio a partir de dos `registros_peso` consecutivos del mismo animal (`(peso2 - peso1) / dias_entre_fechas`).

## Endpoints (módulo `produccion`)

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET/POST | `/produccion/leche` | `produccion:*` | Registro individual de litros |
| POST | `/produccion/leche/lote` | `produccion:create` | Registro masivo (array de `{animalId, litros}` para una fecha/turno) |
| GET | `/produccion/leche/curva/:animalId` | `produccion:view` | Serie temporal de litros del animal |
| GET/POST | `/produccion/peso` | `produccion:*` | Registro individual de peso |
| POST | `/produccion/peso/lote` | `produccion:create` | Registro masivo |
| GET | `/produccion/peso/gdp/:animalId` | `produccion:view` | Serie de GDP calculada entre pesajes |
| GET | `/produccion/indicadores` | `produccion:view` | Agregados por periodo/potrero/lote para gráficos comparativos |

Ambos endpoints `/lote` corren en una transacción única del backend con upsert por `(tenant_id, animal_id, fecha, turno)` para permitir corregir un valor cargado por error el mismo día sin generar duplicados.

## Frontend

```
modules/produccion/
├── views/
│   ├── RegistroLecheView.vue         # tabla masiva por potrero/lote, visible si orientación incluye leche
│   ├── RegistroPesoView.vue          # tabla masiva
│   └── IndicadoresProduccionView.vue # gráficos (vue-chartjs) con filtro de periodo y comparación
├── components/
│   ├── TablaRegistroMasivo.vue       # reutilizada por leche y peso (columnas configurables)
│   ├── CurvaProduccionChart.vue
│   └── GdpChart.vue
├── composables/
│   └── useProduccion.ts
└── services/
    └── produccion.api.ts
```

- El router/menú muestra `RegistroLecheView` solo si `negocio.orientacionProductiva IN (leche, doble_proposito)`, y `RegistroPesoView` siempre disponible (aplica a todo tipo de hato), siguiendo US-1.2 — configurable, no bloqueante.
- `TablaRegistroMasivo.vue` recibe la lista de animales del potrero/lote seleccionado (vía `ganado.store.ts`) y un `campo` (litros o peso) para no duplicar la tabla entre ambos flujos.
