# Requirements — Producción

## User Stories

### US-1: Configurar orientación productiva

Como `ADMIN_NEGOCIO`, quiero definir si mi hato es de leche, carne o doble propósito, para que el sistema muestre las métricas relevantes.

**Criterios de aceptación**

1. EL SISTEMA DEBE permitir configurar por negocio la orientación productiva: `leche`, `carne`, `doble_proposito`.
2. LA ORIENTACIÓN configurada DEBE determinar qué formularios y métricas de producción se muestran por defecto (ej. registro de litros de leche solo visible si aplica), sin impedir registrar el otro tipo manualmente si el usuario lo necesita.

### US-2: Registro de producción de leche

Como usuario operativo, quiero registrar la producción diaria de leche.

**Criterios de aceptación**

1. CUANDO se registra producción de leche, EL SISTEMA DEBE requerir animal, fecha, cantidad (litros) y turno (mañana|tarde|único).
2. EL SISTEMA DEBE permitir registro masivo por lote/potrero en una sola pantalla (ej. tabla con todos los animales en ordeño y un campo de litros cada uno) para agilizar la carga diaria.
3. EL SISTEMA DEBE calcular automáticamente la curva de producción (litros/día) por animal y el promedio del hato, disponible en la ficha del animal y en reportes.

### US-3: Registro de peso / ganancia de peso

Como usuario operativo, quiero registrar el peso de los animales periódicamente.

**Criterios de aceptación**

1. CUANDO se registra un pesaje, EL SISTEMA DEBE requerir animal, fecha y peso (kg).
2. EL SISTEMA DEBE calcular automáticamente la ganancia diaria de peso (GDP) entre pesajes consecutivos del mismo animal.
3. EL SISTEMA DEBE permitir registro masivo de pesajes por lote (misma UX de tabla que en leche).

### US-4: Indicadores de producción

Como usuario, quiero ver tendencias de producción a lo largo del tiempo.

**Criterios de aceptación**

1. EL SISTEMA DEBE mostrar gráficos de evolución de producción (leche y/o peso según orientación) por periodo configurable (últimos 7/30/90 días, rango custom).
2. EL SISTEMA DEBE permitir comparar producción entre potreros o lotes.
