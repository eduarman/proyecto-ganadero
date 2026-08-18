# Design — Sanidad

## Modelo de datos

```
productos_sanitarios
├── id, tenant_id, nombre, tipo ENUM(vacuna, antiparasitario, medicamento, otro)
├── dosis_recomendada VARCHAR NULL, intervalo_refuerzo_dias INT NULL
├── estado ENUM(activo, inactivo), created_at

protocolos_sanitarios
├── id, tenant_id, nombre, producto_id FK
├── edad_inicio_dias INT NULL, frecuencia_dias INT NULL, criterio_json JSONB   -- criterio flexible (especie, sexo, categoría)
├── estado ENUM(activo, inactivo)

aplicaciones_sanitarias
├── id, tenant_id, animal_id FK, producto_id FK
├── fecha, dosis_aplicada VARCHAR, responsable_id FK -> usuarios.id
├── proxima_fecha_esperada DATE NULL   -- calculada al guardar si el producto tiene intervalo_refuerzo_dias
├── observaciones, created_at

diagnosticos_sanitarios
├── id, tenant_id, animal_id FK, fecha, condicion VARCHAR, gravedad ENUM(leve, moderada, grave)
├── tratamiento_aplicacion_id FK -> aplicaciones_sanitarias.id NULL, created_at

cuarentenas
├── id, tenant_id, animal_id FK, fecha_inicio, fecha_fin_estimada NULL, fecha_fin_real NULL
├── motivo VARCHAR, activa BOOLEAN DEFAULT true
```

## Endpoints (módulo `sanidad`)

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET/POST/PATCH | `/sanidad/productos` | `sanidad:*` | Catálogo de productos |
| GET/POST/PATCH | `/sanidad/protocolos` | `sanidad:*` | Protocolos automáticos |
| POST | `/sanidad/aplicaciones` | `sanidad:create` | Registro individual |
| POST | `/sanidad/aplicaciones/lote` | `sanidad:create` | Registro masivo por potrero/lote |
| GET | `/sanidad/aplicaciones/animal/:animalId` | `sanidad:view` | Historial del animal |
| POST | `/sanidad/diagnosticos` | `sanidad:create` | Registro de diagnóstico |
| POST | `/sanidad/cuarentenas` | `sanidad:create` | Iniciar cuarentena |
| PATCH | `/sanidad/cuarentenas/:id/finalizar` | `sanidad:update` | Cerrar cuarentena |
| GET | `/sanidad/alertas` | `sanidad:view` | Refuerzos vencidos/próximos, protocolos no aplicados |

`AplicacionesService.crear()` calcula `proxima_fecha_esperada` si `producto.intervalo_refuerzo_dias` está definido. Un job diario (BullMQ) evalúa protocolos activos contra el padrón de animales (usando `criterio_json`) y genera "aplicaciones esperadas" (no aplicadas) que alimentan `GET /sanidad/alertas` junto con los refuerzos vencidos.

## Frontend

```
modules/sanidad/
├── views/
│   ├── ProductosSanitariosView.vue
│   ├── ProtocolosView.vue
│   ├── RegistroAplicacionesView.vue   # individual + masivo por lote/potrero
│   └── AlertasSanitariasView.vue
├── components/
│   ├── ProductoForm.vue
│   ├── ProtocoloForm.vue
│   ├── AplicacionForm.vue
│   ├── DiagnosticoForm.vue
│   ├── CuarentenaBadge.vue            # visible en ListaGanadoView y DetalleAnimalView
│   └── HistorialSanitario.vue         # usado en tab Sanidad de DetalleAnimalView (módulo ganado)
├── composables/
│   └── useSanidad.ts
└── services/
    └── sanidad.api.ts
```

- `CuarentenaBadge.vue` se integra en `ListaGanadoView.vue` (módulo `ganado`) como columna/indicador visual, consumiendo `GET /sanidad/cuarentenas?activas=true` — el acoplamiento es solo de UI (import de componente), no de lógica de negocio entre módulos backend.
- El rol `VETERINARIO_EXTERNO` tiene su propio layout reducido (`VeterinarioLayout.vue`) que solo expone rutas de `sanidad` y la ficha de animal en modo lectura para los demás módulos, resuelto vía `router/guards.ts` + matriz de permisos.
