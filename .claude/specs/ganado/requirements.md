# Requirements — Gestión del Ganado

Módulo núcleo: el resto de módulos operativos (reproducción, alimentación, producción, sanidad) referencian al `animal` definido aquí.

## User Stories

### US-1: Registro individual de animales

Como usuario operativo, quiero registrar cada animal del hato con su identificación y datos básicos.

**Criterios de aceptación**

1. CUANDO se crea un animal, EL SISTEMA DEBE requerir como mínimo: identificador (arete/caravana), especie (bovino|bufalino), sexo, y DEBE permitir opcionalmente: fecha de nacimiento, raza, color, peso al nacer, madre, padre, foto.
2. EL IDENTIFICADOR (arete) DEBE ser único dentro del negocio (`tenant_id` + `identificador` UNIQUE), pero SE PERMITE que se repita entre negocios distintos.
3. CUANDO se registra la madre y/o el padre (si están en el sistema), EL SISTEMA DEBE vincularlos para construir genealogía, sin requerir que padre/madre existan previamente (pueden cargarse como referencia externa por identificador de texto libre si no están en el sistema).
4. EL SISTEMA DEBE calcular y mostrar automáticamente la edad actual y la categoría etaria sugerida (ternero/a, novillo/a, vaca, toro, etc.) en base a fecha de nacimiento y sexo, editable manualmente por el usuario.

### US-2: Listado, búsqueda y filtro de animales

Como usuario, quiero encontrar animales rápidamente por distintos criterios.

**Criterios de aceptación**

1. EL SISTEMA DEBE permitir filtrar el listado por: potrero actual, categoría, sexo, estado (activo/vendido/muerto/en tránsito), rango de edad.
2. EL SISTEMA DEBE permitir búsqueda por identificador (exacta o parcial).
3. EL LISTADO DEBE ser paginado en backend (no cargar todo el hato en una sola respuesta) para soportar hatos grandes.

### US-3: Ficha individual del animal

Como usuario, quiero ver el historial completo de un animal en un solo lugar.

**Criterios de aceptación**

1. LA FICHA DEL ANIMAL DEBE consolidar, además de sus datos básicos: línea de tiempo de eventos reproductivos, historial de peso/producción, historial sanitario, y potreros por los que ha pasado — cada sección consultando el módulo correspondiente vía su propio endpoint (no se duplica esta data en el módulo `ganado`).
2. LA VISIBILIDAD de cada sección de la ficha DEBE respetar los permisos del rol del usuario (ej. `OPERARIO` sin acceso a reportes financieros igual ve la ficha pero sin datos de costos si los hubiera).

### US-4: Baja de animal

Como usuario operativo, quiero registrar la baja de un animal (venta, muerte, traslado fuera del sistema).

**Criterios de aceptación**

1. CUANDO se da de baja un animal, EL SISTEMA DEBE requerir motivo (venta|muerte|traslado|otro) y fecha, y DEBE marcarlo `estado = inactivo` sin eliminarlo (se preserva el historial).
2. UN ANIMAL dado de baja NO DEBE aparecer en selectores operativos activos (ej. al registrar un nuevo evento sanitario) pero SÍ DEBE seguir siendo consultable en reportes históricos.
3. SI el animal dado de baja tiene eventos reproductivos programados a futuro (ej. servicio con diagnóstico de preñez pendiente), ENTONCES EL SISTEMA DEBE advertir al usuario antes de confirmar la baja.

### US-5: Movimiento entre potreros

Como usuario operativo, quiero registrar que uno o varios animales se movieron a otro potrero.

**Criterios de aceptación**

1. EL SISTEMA DEBE permitir mover un animal individual o un lote/grupo de animales seleccionados a un potrero destino, registrando fecha y usuario que ejecuta el movimiento.
2. CADA MOVIMIENTO DEBE quedar en el historial de ubicaciones del animal Y del potrero (consultable desde ambos lados).
3. EL SISTEMA DEBE impedir mover un animal a un potrero de otro negocio (validación de `tenant_id` compartido).

### US-6: Importación masiva

Como `ADMIN_NEGOCIO` o `MAYORDOMO`, quiero cargar mi inventario inicial de animales sin ingresarlos uno por uno.

**Criterios de aceptación**

1. EL SISTEMA DEBE ofrecer importación vía archivo CSV/Excel con plantilla descargable predefinida.
2. CUANDO la importación tiene filas inválidas, EL SISTEMA DEBE procesar las filas válidas e informar el detalle de las filas rechazadas (número de fila + motivo), sin abortar todo el lote por errores puntuales.
