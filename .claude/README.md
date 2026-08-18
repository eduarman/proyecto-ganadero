# .claude — Documentación de dirección del proyecto

Esta carpeta contiene la documentación que guía el desarrollo del sistema de gestión ganadera: decisiones de producto/arquitectura transversales (`steering/`) y especificaciones funcionales por módulo (`specs/`).

## Steering (decisiones transversales, leer primero y siempre vigentes)

| Archivo | Contenido |
|---|---|
| [`steering/product.md`](steering/product.md) | Visión de producto, módulos funcionales, planes de suscripción |
| [`steering/tech.md`](steering/tech.md) | Stack técnico completo (Vue 3, NestJS, PostgreSQL, Capacitor, etc.) |
| [`steering/structure.md`](steering/structure.md) | Estructura de carpetas del monorepo |
| [`steering/security-roles.md`](steering/security-roles.md) | Roles, permisos, capas de autorización backend/frontend |
| [`steering/subscriptions.md`](steering/subscriptions.md) | Modelo de datos de suscripciones y multi-tenancy |

## Specs por módulo funcional

Cada carpeta en `specs/` contiene `requirements.md` (historias de usuario + criterios de aceptación en formato EARS), `design.md` (modelo de datos, endpoints, estructura frontend) y `tasks.md` (checklist de implementación backend/frontend).

1. [`specs/auth-login/`](specs/auth-login/) — Autenticación, login, registro, recuperación de contraseña
2. [`specs/usuarios-roles/`](specs/usuarios-roles/) — Gestión de usuarios y roles del negocio
3. [`specs/suscripciones-negocios/`](specs/suscripciones-negocios/) — Planes, límites, multi-negocio (Plan 3)
4. [`specs/ganado/`](specs/ganado/) — Gestión del ganado (módulo núcleo)
5. [`specs/potreros/`](specs/potreros/) — Potreros, ocupación, geolocalización
6. [`specs/reproduccion/`](specs/reproduccion/) — Eventos reproductivos
7. [`specs/alimentacion/`](specs/alimentacion/) — Planes de alimentación y suministros
8. [`specs/produccion/`](specs/produccion/) — Producción de leche/peso
9. [`specs/sanidad/`](specs/sanidad/) — Sanidad animal
10. [`specs/reportes/`](specs/reportes/) — Reportes y exportación
11. [`specs/dashboard/`](specs/dashboard/) — Panel general (agrega todo lo anterior)

## Orden sugerido de implementación

El orden refleja dependencias reales entre módulos (ver sección "Dependencias" al final de cada `tasks.md`):

```
1. auth-login              (base de sesión/permisos para todo lo demás)
2. suscripciones-negocios  (tenant_id, planes, límites — se modela junto con auth-login)
3. usuarios-roles          (invitaciones, matriz de permisos)
4. ganado                  (entidad núcleo referenciada por todos los módulos operativos)
5. potreros                (referenciado por ganado, alimentacion, sanidad)
6. reproduccion            (depende solo de ganado)
7. alimentacion            (depende de ganado + potreros)
8. produccion              (depende de ganado + potreros)
9. sanidad                 (depende de ganado + potreros)
10. reportes                (agrega todos los módulos operativos)
11. dashboard                (agrega todos los módulos operativos + reportes)
```

En la práctica, 1–3 son un bloque inicial indivisible (auth, tenancy y roles se modelan juntos), y 5–9 pueden desarrollarse en paralelo entre sí una vez completo el bloque 1–4.

## Cómo usar esta documentación al pedir implementación

Al pedirle a Claude Code que implemente una feature, referenciar la spec concreta (ej. "implementa el backend de `specs/auth-login` siguiendo su `design.md`") da mejores resultados que pedir el módulo completo de una sola vez — permite revisar el modelo de datos y los endpoints antes de generar el frontend.

## Mantenimiento

Estos documentos son la fuente de verdad de **intención**, no de estado actual del código — si una decisión cambia durante la implementación (ej. se descarta PostGIS, se cambia de Prisma a otro ORM), actualizar el steering/spec correspondiente en el mismo cambio, no después.
