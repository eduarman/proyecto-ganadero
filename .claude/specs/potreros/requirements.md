# Requirements — Potreros

## User Stories

### US-1: Inventario de potreros

Como usuario, quiero registrar los potreros/lotes de mi finca con sus características.

**Criterios de aceptación**

1. CUANDO se crea un potrero, EL SISTEMA DEBE requerir nombre y área (hectáreas), y DEBE permitir opcionalmente: tipo de pasto, capacidad de carga estimada (animales/ha o UGG/ha), y geolocalización (punto central o polígono).
2. EL NOMBRE del potrero DEBE ser único dentro del negocio.
3. EL SISTEMA DEBE mostrar, para cada potrero, la ocupación actual (cantidad de animales asignados) calculada en base a `animales.potrero_actual_id`, sin duplicar ese dato en la tabla de potreros.

### US-2: Ocupación y carga animal

Como usuario, quiero saber si un potrero está sobrecargado respecto a su capacidad.

**Criterios de aceptación**

1. EL SISTEMA DEBE calcular la carga actual (animales o UGG actuales / área) y compararla contra la capacidad de carga configurada, marcando visualmente el potrero como "en capacidad", "cerca del límite" o "sobrecargado".
2. CUANDO un movimiento de animales (módulo `ganado`) haría que un potrero destino supere su capacidad, EL SISTEMA DEBE advertir al usuario antes de confirmar (no bloquear — es una alerta, la decisión final es del usuario).

### US-3: Historial de rotación

Como usuario, quiero ver qué potreros han estado ocupados y por cuánto tiempo, para planear la rotación.

**Criterios de aceptación**

1. EL SISTEMA DEBE mostrar, por potrero, el historial de periodos de ocupación (derivado de `animal_movimientos` del módulo `ganado`: cuándo entraron y salieron animales).
2. EL SISTEMA DEBE mostrar los días de descanso desde la última vez que el potrero quedó vacío, dato relevante para decidir la próxima rotación.

### US-4: Geolocalización

Como usuario, quiero ubicar mis potreros en un mapa.

**Criterios de aceptación**

1. CUANDO el potrero tiene coordenadas cargadas, EL SISTEMA DEBE mostrarlo en una vista de mapa junto a los demás potreros del negocio.
2. EL SISTEMA DEBE permitir cargar la ubicación dibujando un polígono en el mapa o ingresando coordenadas manualmente.
3. LA VISTA DE MAPA es progresiva: si el usuario no carga geolocalización, el resto del módulo (inventario, ocupación, rotación) DEBE funcionar igualmente sin mapa.

### US-5: Baja/inactivación de potrero

Como usuario, quiero dar de baja un potrero que ya no se usa (ej. cambió de uso de suelo).

**Criterios de aceptación**

1. EL SISTEMA NO DEBE permitir inactivar un potrero que tiene animales actualmente asignados (`potrero_actual_id`); debe indicar cuántos animales hay que mover primero.
2. UN POTRERO inactivado DEBE dejar de aparecer como destino válido en movimientos de animales, pero conserva su historial.
