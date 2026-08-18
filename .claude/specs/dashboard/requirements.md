# Requirements — Panel General (Dashboard)

## User Stories

### US-1: Resumen ejecutivo al ingresar

Como usuario, quiero ver de inmediato el estado general de mi negocio al iniciar sesión.

**Criterios de aceptación**

1. EL DASHBOARD DEBE ser la vista de aterrizaje tras el login (ruta `/dashboard`).
2. EL SISTEMA DEBE mostrar indicadores clave: total de animales activos (por categoría), ocupación general de potreros, producción del período reciente (leche y/o peso según orientación productiva), y alertas activas (sanitarias y reproductivas).
3. CADA INDICADOR mostrado DEBE respetar el permiso del rol del usuario — un `OPERARIO` ve un dashboard reducido sin indicadores financieros/costos (ver `security-roles.md`).

### US-2: Alertas centralizadas

Como usuario, quiero ver en un solo lugar todo lo que requiere mi atención.

**Criterios de aceptación**

1. EL DASHBOARD DEBE consolidar alertas de `sanidad` (refuerzos vencidos/próximos) y `reproduccion` (diagnósticos pendientes, partos próximos, destetes sugeridos) ordenadas por urgencia (vencidas primero).
2. CADA ALERTA DEBE tener un link directo a la acción correspondiente (ej. click en "3 vacunas vencidas" navega al listado filtrado en `sanidad`).
3. EL SISTEMA NO DEBE requerir una llamada adicional pesada por cada tipo de alerta: el backend expone un único endpoint agregador para el dashboard.

### US-3: Indicadores de tendencia

Como `ADMIN_NEGOCIO`/`MAYORDOMO`, quiero ver cómo evolucionan los indicadores clave en el tiempo.

**Criterios de aceptación**

1. EL DASHBOARD DEBE mostrar al menos un gráfico de tendencia de producción (últimos 30 días) y un gráfico de natalidad/mortalidad reciente.
2. LOS GRÁFICOS DEBEN reutilizar los mismos componentes de chart usados en `reportes` (no se reimplementa la visualización).

### US-4: Selector de negocio (Plan 3)

Como usuario con acceso a varios negocios, quiero que el dashboard refleje siempre el negocio activo.

**Criterios de aceptación**

1. CUANDO el usuario cambia de negocio activo (`TenantSwitcher`, ver `auth-login`), EL DASHBOARD DEBE recargar todos sus indicadores para el nuevo `tenantId`, sin mezclar datos del negocio anterior.
2. EL DASHBOARD estándar (`/dashboard`) DEBE mostrar siempre datos de un único negocio a la vez; la vista consolidada multi-negocio vive en `reportes` (US-4 de ese spec), no en el dashboard.
