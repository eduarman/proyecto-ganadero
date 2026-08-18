# Design — Eventos Reproductivos

## Modelo de datos

```
celos
├── id, tenant_id, animal_id FK, fecha, observaciones, created_at

servicios
├── id, tenant_id, animal_id FK (hembra), tipo ENUM(monta_natural, ia, te)
├── fecha, macho_id FK NULL, semen_referencia VARCHAR NULL
├── estado ENUM(pendiente_diagnostico, confirmado_prenada, vacio, abortado)
├── created_at

diagnosticos_gestacion
├── id, tenant_id, servicio_id FK, resultado ENUM(prenada, vacia, dudoso)
├── metodo ENUM(palpacion, ecografia, otro), fecha, created_at

partos
├── id, tenant_id, servicio_id FK NULL, madre_id FK -> animales.id
├── fecha, tipo ENUM(normal, distocico, cesarea)
├── cria_animal_id FK -> animales.id NULL   -- si nació viva y se dio de alta
├── mortinato BOOLEAN DEFAULT false
├── observaciones, created_at

destetes
├── id, tenant_id, animal_id FK (cría), fecha, peso_destete DECIMAL NULL, created_at
```

Configuración por negocio (tabla `configuracion_reproductiva` o columnas en `negocios`): `ciclo_celo_dias` (default 21), `dias_para_diagnostico` (default 35), `gestacion_bovino_dias` (default 283), `gestacion_bufalino_dias` (default 310), `edad_destete_dias` (default 240) — todos editables desde configuración del negocio, con default razonable si no se configuran.

## Endpoints (módulo `reproduccion`)

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/reproduccion/animal/:animalId` | `reproduccion:view` | Línea de tiempo reproductiva completa del animal |
| POST | `/reproduccion/celos` | `reproduccion:create` | Registrar celo |
| POST | `/reproduccion/servicios` | `reproduccion:create` | Registrar servicio (valida US-2.3) |
| POST | `/reproduccion/diagnosticos` | `reproduccion:create` | Registrar diagnóstico (actualiza estado del servicio) |
| POST | `/reproduccion/partos` | `reproduccion:create` | Registrar parto (opcionalmente crea animal cría vía llamada interna a `GanadoService`) |
| POST | `/reproduccion/destetes` | `reproduccion:create` | Registrar destete |
| GET | `/reproduccion/calendario` | `reproduccion:view` | Eventos próximos/vencidos calculados para todo el negocio |

`ReproduccionService.registrarParto()` invoca internamente `GanadoService.crearAnimal()` (mismo proceso, no HTTP) cuando la cría nace viva, pre-cargando `madre_id`. Mantiene la creación del animal centralizada en el módulo `ganado`, evitando lógica de alta duplicada.

## Cálculo del calendario (`GET /reproduccion/calendario`)

Job/query que combina, por animal activo del negocio:
- Celo esperado: último `celo` o `servicio` sin diagnóstico + `ciclo_celo_dias`.
- Diagnóstico pendiente: `servicio.estado = pendiente_diagnostico` y `fecha + dias_para_diagnostico <= hoy` → vencido.
- Parto próximo: `diagnostico.resultado = prenada` sin `parto` asociado, fecha estimada = `servicio.fecha + gestacion_[especie]_dias`.
- Destete sugerido: animal cría sin `destete`, edad >= `edad_destete_dias`.

Se expone también como job periódico (BullMQ, diario) que genera notificaciones/alertas persistidas para consumo del `dashboard`, evitando recalcular todo en cada carga de pantalla.

## Frontend

```
modules/reproduccion/
├── views/
│   └── CalendarioReproductivoView.vue
├── components/
│   ├── RegistrarCeloModal.vue
│   ├── RegistrarServicioModal.vue
│   ├── RegistrarDiagnosticoModal.vue
│   ├── RegistrarPartoModal.vue        # incluye opción "dar de alta cría" inline
│   ├── RegistrarDesteteModal.vue
│   └── LineaTiempoReproductiva.vue    # usado dentro de DetalleAnimalView (módulo ganado)
├── composables/
│   └── useReproduccion.ts
└── services/
    └── reproduccion.api.ts
```
