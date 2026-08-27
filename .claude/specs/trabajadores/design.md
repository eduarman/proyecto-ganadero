# Design — Trabajadores

## Enfoque

Módulo nuevo, multi-tenant como el resto (`tenant_id` = `Negocio` — ver decisión de alcance en `requirements.md`). Reutiliza infraestructura ya existente en vez de crear mecanismos paralelos:

- **Catálogos** (`cargos`, `actividades`): mismo patrón que `InsumoAlimentacion`/`ProductoSanitario` (activo/inactivo, no se elimina en uso).
- **Confirmación blanda** (asistencia duplicada, pago a inactivo): mismo patrón `ConflictException` + `code` + flag `confirmar` ya usado en `potreros` (sobrecarga), `reproduccion` y `alimentacion` esta sesión — no es un mecanismo nuevo.
- **Exportación de reportes**: reutiliza `ExportService` del módulo `reportes` (Excel/PDF/CSV) — no se reimplementa.
- **Arrays de referencia** (`trabajador_ids`, `animal_ids`): mismo patrón ya usado en `Suministro.animalIds`/`AplicacionSanitaria` en vez de tablas puente, salvo en `pagos_adelantos`/`pagos_prestamos` donde sí hace falta una tabla puente porque cada vínculo lleva un monto propio (no es una simple lista de IDs).
- **Valores derivados no se persisten**: horas trabajadas, antigüedad, saldos de adelanto/préstamo y KPIs de la ficha se calculan en el service al leer, igual que `categoria_etaria`, GDP y ocupación de potreros en otros módulos — evita datos duplicados/desincronizados.

## Modelo de datos

```
cargos
├── id, tenant_id, nombre, estado ENUM(activo, inactivo), created_at
-- UNIQUE (tenant_id, nombre)

actividades
├── id, tenant_id, nombre, estado ENUM(activo, inactivo), created_at
-- sembrado con el catálogo base (alimentación, ordeño, limpieza, vacunación,
-- desparasitación, manejo de ganado, pesaje, mantenimiento, manejo de
-- potreros, reparación, vigilancia, otras) al crear el negocio; permite altas
-- personalizadas -- UNIQUE (tenant_id, nombre)

trabajadores
├── id, tenant_id
├── nombres, apellidos, documento VARCHAR   -- UNIQUE (tenant_id, documento)
├── fecha_nacimiento DATE NULL, telefono NULL, email NULL, direccion NULL
├── contacto_emergencia_nombre NULL, contacto_emergencia_telefono NULL
├── cargo_id FK -> cargos.id
├── fecha_ingreso DATE
├── tipo_contratacion ENUM(mensual, jornal, por_actividad, temporal, otro)
├── modalidad_pago ENUM(mensual, semanal, quincenal, diario, por_actividad)
├── salario_o_jornal DECIMAL
├── estado ENUM(activo, inactivo)
├── created_at / updated_at

asignaciones
├── id, tenant_id, trabajador_id FK
├── cargo_id FK NULL, potrero_id FK NULL   -- al menos uno de los dos
├── fecha_inicio, fecha_fin NULL           -- NULL = vigente
├── estado ENUM(vigente, finalizada)
├── observaciones NULL, created_at

actividades_realizadas
├── id, tenant_id, actividad_id FK
├── trabajador_ids UUID[]                  -- una o varias personas (US-5.2)
├── fecha, hora_inicio TIME NULL, hora_fin TIME NULL
├── potrero_id FK NULL, cantidad_animales INT NULL, animal_ids UUID[] NULL
├── observaciones NULL, registrado_por FK -> usuarios.id, created_at

asistencias
├── id, tenant_id, trabajador_id FK, fecha
├── estado ENUM(presente, ausente, permiso, vacaciones, falta_justificada, falta_injustificada)
├── hora_entrada TIME NULL, hora_salida TIME NULL   -- horas trabajadas: calculado, no se guarda
├── tipo_jornada VARCHAR NULL, jornal_realizado DECIMAL NULL
├── observaciones NULL, registrado_por FK -> usuarios.id, created_at
-- UNIQUE (tenant_id, trabajador_id, fecha); reemplazar exige confirmar=true (US-6.5)

pagos
├── id, tenant_id, trabajador_id FK
├── tipo ENUM(salario, jornal, por_actividad, bono, comision, otro)
├── periodo_desde, periodo_hasta
├── monto_base DECIMAL, bonificaciones DECIMAL DEFAULT 0
├── adelantos_descontados DECIMAL DEFAULT 0, prestamos_descontados DECIMAL DEFAULT 0
├── otros_descuentos DECIMAL DEFAULT 0, monto_total DECIMAL   -- congelado al confirmar (US-7.3)
├── moneda ENUM(usd, ves), tasa_cambio DECIMAL NULL, monto_equivalente DECIMAL NULL
├── detalle_json JSONB              -- desglose línea por línea, tal como se mostró en la previsualización
├── fecha, observaciones NULL, confirmado_por FK -> usuarios.id, created_at

pagos_adelantos  -- puente: qué se descontó de cada adelanto en cada pago
├── id, pago_id FK, adelanto_id FK, monto_descontado DECIMAL

pagos_prestamos  -- puente: qué se descontó de cada préstamo en cada pago
├── id, pago_id FK, prestamo_id FK, monto_descontado DECIMAL

adelantos
├── id, tenant_id, trabajador_id FK
├── fecha, monto DECIMAL, moneda ENUM(usd, ves), tasa_cambio DECIMAL NULL, monto_equivalente DECIMAL NULL
├── motivo NULL, metodo_entrega NULL, observaciones NULL
├── monto_descontado DECIMAL DEFAULT 0   -- se incrementa vía pagos_adelantos
├── estado ENUM(pendiente, parcial, saldado)
├── registrado_por FK -> usuarios.id, created_at

prestamos
├── id, tenant_id, trabajador_id FK
├── fecha, monto_original DECIMAL, moneda ENUM(usd, ves), tasa_cambio DECIMAL NULL, monto_equivalente DECIMAL NULL
├── numero_cuotas INT, valor_cuota DECIMAL, fecha_inicio DATE
├── observaciones NULL, estado ENUM(vigente, saldado)
├── registrado_por FK -> usuarios.id, created_at

prestamo_abonos
├── id, prestamo_id FK, fecha, monto DECIMAL, pago_id FK NULL   -- NULL = abono manual (no vía liquidación)
├── observaciones NULL, created_at

historial_trabajador
├── id, tenant_id, trabajador_id FK
├── tipo VARCHAR    -- alta | edicion | cambio_estado | asignacion | pago | adelanto | prestamo
├── descripcion VARCHAR, data JSONB NULL
├── usuario_id FK -> usuarios.id, created_at
```

`moneda` es un enum nuevo (`USD`, `VES`) **acotado a este módulo** (`pagos`, `adelantos`, `prestamos`, `prestamo_abonos`) — no se toca ningún otro módulo (ver decisión de alcance). `tasa_cambio`/`monto_equivalente` se congelan al crear cada registro (US-10.3); nunca se recalculan retroactivamente.

## Endpoints (módulo `trabajadores`)

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET/POST/PATCH | `/trabajadores` | RW `ADMIN_NEGOCIO`/`MAYORDOMO` | CRUD de trabajadores |
| PATCH | `/trabajadores/:id/activar` \| `/inactivar` | RW `ADMIN_NEGOCIO`/`MAYORDOMO` | Cambio de estado |
| GET | `/trabajadores/:id/ficha` | R `ADMIN_NEGOCIO`/`MAYORDOMO` | Payload agregado de la ficha (US-2): datos + indicadores calculados, cada sección resuelta internamente contra el service correspondiente |
| GET/POST/PATCH | `/trabajadores/cargos` | RW `ADMIN_NEGOCIO`/`MAYORDOMO` | Catálogo de cargos |
| GET/POST/PATCH | `/trabajadores/actividades` | RW `ADMIN_NEGOCIO`/`MAYORDOMO` | Catálogo de actividades |
| GET/POST | `/trabajadores/asignaciones` | RW `ADMIN_NEGOCIO`/`MAYORDOMO` | Alta y listado (filtrable por trabajador) |
| PATCH | `/trabajadores/asignaciones/:id/finalizar` | RW `ADMIN_NEGOCIO`/`MAYORDOMO` | Cierra la asignación vigente (setea `fecha_fin`) |
| GET/POST | `/trabajadores/actividades-realizadas` | RW `ADMIN_NEGOCIO`/`MAYORDOMO` | Registro de actividad ejecutada y listado |
| GET/POST | `/trabajadores/asistencias` | RW `ADMIN_NEGOCIO`/`MAYORDOMO` | Alta (con `confirmar` ante duplicado) y listado |
| GET | `/trabajadores/pagos/previsualizar` | RW `ADMIN_NEGOCIO`, R `MAYORDOMO` | Calcula el detalle de liquidación sin persistir (US-7.2) |
| POST | `/trabajadores/pagos` | RW solo `ADMIN_NEGOCIO` | Confirma el pago con el detalle ya calculado (US-7.3/7.4) |
| GET | `/trabajadores/pagos` | RW `ADMIN_NEGOCIO`, R `MAYORDOMO` | Listado |
| GET/POST | `/trabajadores/adelantos` | RW solo `ADMIN_NEGOCIO` (lectura también `MAYORDOMO`) | Alta y listado |
| GET/POST | `/trabajadores/prestamos` | RW solo `ADMIN_NEGOCIO` (lectura también `MAYORDOMO`) | Alta y listado |
| POST | `/trabajadores/prestamos/:id/abonos` | RW solo `ADMIN_NEGOCIO` | Abono manual |
| GET | `/trabajadores/reportes/:tipo` | R `ADMIN_NEGOCIO`/`MAYORDOMO` | `tipo` ∈ `trabajadores`, `asistencia`, `pagos`, `costo-laboral` |
| GET | `/trabajadores/reportes/:tipo/exportar` | R `ADMIN_NEGOCIO`/`MAYORDOMO` | Reutiliza `ExportService` de `reportes` (Excel/PDF/CSV) |
| GET | `/trabajadores/dashboard` | R `ADMIN_NEGOCIO`/`MAYORDOMO` | Resumen ejecutivo del módulo (US-12) |

Reglas transversales de `requirements.md` §14 se implementan así:

- **Pago a inactivo sin autorización** (US-7.4): `POST /trabajadores/pagos` valida `trabajador.estado === 'activo'`; si no, `409 { code: 'TRABAJADOR_INACTIVO' }` salvo `confirmar: true` — y ese flag solo lo acepta el guard de rol `ADMIN_NEGOCIO` (no expuesto a `MAYORDOMO` a nivel de ruta).
- **Asistencia futura / salida antes que entrada**: validación de DTO + service, mismo nivel que otras validaciones de fecha ya existentes (`produccion`, `sanidad`).
- **No eliminar históricos**: no existen endpoints `DELETE` para `asistencias`, `actividades_realizadas`, `pagos`, `adelantos`, `prestamos` — solo alta y, donde aplica, cambio de estado.
- **Auditoría de cambios críticos**: cada service que muta `trabajadores`, `asignaciones`, `pagos`, `adelantos` o `prestamos` escribe una fila en `historial_trabajador` dentro de la misma transacción — no se construye un sistema de auditoría genérico nuevo, es específico de este módulo (no existe uno general hoy en la plataforma).

## Frontend

```
modules/trabajadores/
├── views/
│   ├── ListaTrabajadoresView.vue
│   ├── FichaTrabajadorView.vue        # tabs: general/asignaciones/asistencia/actividades/pagos/adelantos/prestamos/historial
│   ├── AsignacionesView.vue
│   ├── AsistenciaView.vue
│   ├── ActividadesView.vue            # catálogo + registro de actividades realizadas
│   ├── PagosView.vue                  # flujo previsualizar -> confirmar
│   ├── AdelantosPrestamosView.vue
│   ├── ReportesTrabajadoresView.vue
│   └── DashboardTrabajadoresView.vue
├── components/
│   ├── TrabajadorForm.vue
│   ├── CargoActividadForm.vue         # catálogo simple, reutilizado en cargos y actividades
│   ├── LiquidacionPreview.vue         # desglose línea por línea antes de confirmar (US-7.2)
│   └── MonedaTasaInput.vue            # monto + selector de moneda + tasa, reutilizado en pagos/adelantos/prestamos
├── composables/
│   └── useTrabajadores.ts
└── services/
    └── trabajadores.api.ts
```

- Entrada de navegación "Trabajadores" con submenús (Asignaciones, Asistencia y Jornadas, Actividades, Pagos, Adelantos y Préstamos, Reportes), visible solo para `ADMIN_NEGOCIO`/`MAYORDOMO` — mismo mecanismo de filtrado por rol ya usado en `shared/nav.ts` (`NAV_KEYS_ADMIN`/`NAV_KEYS_SIN_OPERARIO`).
- `LiquidacionPreview.vue` es el componente central de US-7: llama primero a `previsualizar`, muestra el desglose, y solo al confirmar dispara el `POST /trabajadores/pagos` con el mismo payload ya mostrado (nunca se recalcula silenciosamente entre preview y confirmación).
- `DashboardTrabajadoresView.vue` reutiliza `KpiCard.vue`/`SectionCard.vue`/gráficos ya existentes en `shared/components/` y el patrón de charts de `reportes` (US-12, mismo criterio que el `dashboard` general con `TendenciasSection.vue`).
