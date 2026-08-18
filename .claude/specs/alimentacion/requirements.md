# Requirements — Alimentación

## User Stories

### US-1: Planes de alimentación

Como usuario, quiero definir planes de alimentación (dietas) que luego se aplican a potreros o lotes de animales.

**Criterios de aceptación**

1. CUANDO se crea un plan de alimentación, EL SISTEMA DEBE requerir nombre, tipo (pastoreo|suplementación|estabulado|mixto) y composición (uno o más insumos con cantidad por unidad de tiempo/animal).
2. EL SISTEMA DEBE permitir asignar un plan de alimentación activo a uno o varios potreros o a un grupo de animales.

### US-2: Registro de consumo/suministro

Como usuario operativo, quiero registrar la alimentación suministrada día a día.

**Criterios de aceptación**

1. CUANDO se registra un suministro, EL SISTEMA DEBE requerir fecha, potrero o lote de animales destino, insumo, cantidad y unidad.
2. EL SISTEMA DEBE permitir registrar suministros recurrentes (ej. "diario, 5kg de suplemento por animal") sin tener que cargarlo manualmente cada día — genera registros programados, editable/cancelable a futuro.

### US-3: Catálogo de insumos

Como usuario, quiero mantener un catálogo de los insumos/alimentos que uso.

**Criterios de aceptación**

1. EL SISTEMA DEBE permitir crear insumos con nombre, unidad de medida (kg, litros, fardos, etc.) y costo unitario opcional (para reportes de costo).
2. UN INSUMO en uso por algún plan o registro de suministro NO DEBE poder eliminarse, solo inactivarse.

### US-4: Costos de alimentación

Como `ADMIN_NEGOCIO`, quiero ver cuánto estoy gastando en alimentación.

**Criterios de aceptación**

1. CUANDO los insumos tienen costo unitario cargado, EL SISTEMA DEBE calcular el costo total de alimentación por periodo, por potrero y por lote, disponible en el módulo de reportes.
2. SI un insumo no tiene costo cargado, ENTONCES EL SISTEMA DEBE excluirlo del cálculo de costos pero seguir contabilizando su cantidad física, marcando el reporte como "costo parcial" cuando aplique.
