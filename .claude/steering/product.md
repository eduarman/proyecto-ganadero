# Producto — Visión y Alcance

## Qué es

Sistema SaaS de gestión ganadera para explotaciones de ganado bovino, bufalino y vacuno (bovinos en general). Web app + app móvil (empaquetada con Capacitor sobre el mismo código Vue). Permite a un productor o administrador de finca llevar el control operativo completo de su hato: eventos reproductivos, potreros, alimentación, producción, sanidad y el inventario de animales, con reportes y un panel general (dashboard) que resume el estado del negocio.

## Problema que resuelve

Los productores ganaderos medianos/pequeños suelen llevar esta información en cuadernos, hojas de Excel sueltas o sistemas genéricos no especializados. Esto genera pérdida de trazabilidad (ej. historial reproductivo de un animal, vacunas aplicadas, rotación de potreros), decisiones tardías (detección de celos, vencimiento de vacunas, sobrepastoreo) y ningún reporte consolidado para tomar decisiones de negocio.

## Usuarios objetivo

- **Productor/dueño de finca**: quiere visibilidad total del negocio, reportes, y no necesariamente opera el día a día.
- **Administrador de finca / mayordomo**: opera el sistema a diario, registra eventos, gestiona potreros y sanidad.
- **Operario de campo**: rol limitado, registra eventos puntuales (pesajes, tratamientos, movimientos) sin acceso a reportes financieros ni configuración.
- **Veterinario externo** (opcional, futuro): acceso acotado al módulo de sanidad de un negocio específico.

## Módulos funcionales

1. **Panel general (Dashboard)**: resumen ejecutivo — inventario actual, alertas (vacunas próximas, celos esperados, partos próximos), indicadores clave (natalidad, mortalidad, producción).
2. **Gestión del ganado**: registro individual de animales (identificación, raza, sexo, fecha de nacimiento, categoría, estado, genealogía, foto), altas/bajas, movimientos entre potreros.
3. **Eventos reproductivos**: celos, servicios (monta natural/IA/transferencia embrionaria), diagnósticos de gestación, partos, destetes, calendario reproductivo por animal.
4. **Potreros**: inventario de potreros/lotes (área, capacidad de carga, tipo de pasto, geolocalización), rotación y ocupación actual, historial de uso.
5. **Alimentación**: planes de alimentación, suplementación, consumo por lote/potrero, costos asociados.
6. **Producción**: registro de producción (leche, peso/ganancia de peso según finalidad del hato), curvas de producción por animal y por hato.
7. **Sanidad**: vacunación, tratamientos, diagnósticos, calendario sanitario, alertas de vencimiento, cuarentenas.
8. **Reportes**: reportes consolidados y exportables (PDF/Excel) por módulo y cruzados (ej. costo de alimentación vs producción).
9. **Gestión de usuarios y roles**: administración de usuarios internos del negocio, asignación de roles y permisos.
10. **Gestión de suscripción y negocios**: administración del plan contratado, límites de uso, y (plan 3) gestión de múltiples negocios/localidades.
11. **Trabajadores**: gestión de personal de campo — cargos, asignaciones, actividades realizadas, asistencia/jornadas, pagos/liquidaciones, adelantos y préstamos, con soporte de moneda (USD/VES) y tasa de cambio histórica.

Ver detalle funcional de cada módulo en `.claude/specs/<modulo>/requirements.md`.

## Modelo de negocio — Planes de suscripción

| Plan | Usuarios | Negocios/Localidades | Descripción |
|---|---|---|---|
| **Plan 1 — Individual** | 1 (el administrador) | 1 | Un único usuario administrador con acceso total a todos los módulos de un solo negocio. Pensado para el productor que opera solo. |
| **Plan 2 — Equipo** | Hasta 4 (1 admin + hasta 3 perfilados) | 1 | Administrador + hasta 3 usuarios adicionales con roles/perfiles específicos (ej. operario, mayordomo). Un solo negocio/localidad. |
| **Plan 3 — Multi-negocio** | Hasta 4 por negocio | Varios negocios/localidades | Todo lo del Plan 2, pero el administrador puede crear y administrar múltiples negocios/localidades independientes (equivalente a multisite de WordPress), cada uno con su propio hato, usuarios y datos, bajo una misma cuenta de facturación. |

Reglas de negocio clave:

- El plan determina límites duros: cantidad máxima de usuarios activos y cantidad máxima de negocios/localidades. El backend valida estos límites en cada operación de alta (no solo el frontend).
- Downgrade de plan: si el negocio excede el nuevo límite (ej. de Plan 2 a Plan 1 con 3 usuarios activos), el sistema no permite el downgrade hasta que el admin desactive usuarios/negocios excedentes.
- Cada negocio/localidad del Plan 3 es un tenant lógico independiente (datos aislados vía `tenant_id`), pero comparten el mismo titular de cuenta/facturación.
- El vencimiento o suspensión de la suscripción no borra datos: pasa la cuenta a modo solo-lectura hasta regularización.

Detalle de implementación en `.claude/steering/subscriptions.md`.

## Fuera de alcance (por ahora)

- Marketplace de compra/venta de ganado.
- Integración con dispositivos IoT (caravanas electrónicas, básculas conectadas) — se deja la arquitectura preparada (API-first) pero no se implementa en esta fase.
- Facturación electrónica/contabilidad completa — solo gestión de suscripción SaaS, no contabilidad del negocio ganadero.
