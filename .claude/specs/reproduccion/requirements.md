# Requirements — Eventos Reproductivos

## User Stories

### US-1: Registrar celo

Como usuario operativo, quiero registrar cuándo una hembra entra en celo.

**Criterios de aceptación**

1. CUANDO se registra un celo, EL SISTEMA DEBE requerir animal (hembra) y fecha, y DEBE permitir observaciones (intensidad, método de detección).
2. EL SISTEMA DEBE calcular y mostrar la fecha estimada del próximo celo (ciclo estándar ~21 días, configurable) si no se registra un servicio antes de esa fecha, como recordatorio.

### US-2: Registrar servicio (monta/IA/transferencia embrionaria)

Como usuario operativo, quiero registrar el servicio reproductivo aplicado a una hembra.

**Criterios de aceptación**

1. CUANDO se registra un servicio, EL SISTEMA DEBE requerir animal (hembra), tipo (monta natural|inseminación artificial|transferencia embrionaria), fecha, y DEBE permitir registrar el macho/semen utilizado (referencia a animal del sistema o texto libre para semen de catálogo/toro externo).
2. EL SISTEMA DEBE calcular automáticamente la fecha estimada de diagnóstico de preñez recomendado (ej. +30-45 días, configurable) y la fecha probable de parto (gestación promedio por especie, configurable: bovino ~283 días, bufalino ~310 días).
3. UN ANIMAL con un servicio activo sin diagnóstico negativo NO DEBE poder registrar un nuevo servicio sin antes registrar el resultado del anterior (evita servicios duplicados/inconsistentes) — el sistema advierte y pide confirmación explícita si el usuario insiste.

### US-3: Diagnóstico de gestación

Como usuario operativo, quiero registrar el resultado del diagnóstico de preñez.

**Criterios de aceptación**

1. CUANDO se registra un diagnóstico, EL SISTEMA DEBE requerir el servicio asociado, resultado (preñada|vacía|dudoso), fecha y método (palpación|ecografía|otro).
2. CUANDO el resultado es "vacía", EL SISTEMA DEBE cerrar el ciclo del servicio asociado y volver a habilitar el registro de nuevos servicios para ese animal.
3. CUANDO el resultado es "preñada", EL SISTEMA DEBE actualizar la fecha probable de parto en base a la fecha real del servicio confirmado.

### US-4: Registrar parto

Como usuario operativo, quiero registrar el parto y sus datos.

**Criterios de aceptación**

1. CUANDO se registra un parto, EL SISTEMA DEBE requerir animal (madre), fecha, tipo (normal|distócico|cesárea), y DEBE permitir registrar la cría (si nace viva, ofrecer alta directa como nuevo animal con madre pre-vinculada).
2. EL SISTEMA DEBE permitir registrar mortinato (cría nacida muerta) sin crear un registro de animal, pero sí dejar constancia en el historial reproductivo de la madre.
3. EL SISTEMA DEBE cerrar automáticamente el ciclo reproductivo abierto (servicio → diagnóstico preñada → parto) al registrar el parto.

### US-5: Registrar destete

Como usuario operativo, quiero registrar cuándo una cría fue destetada.

**Criterios de aceptación**

1. CUANDO se registra un destete, EL SISTEMA DEBE requerir animal (cría) y fecha, y DEBE permitir registrar peso al destete.
2. EL SISTEMA DEBE sugerir animales candidatos a destete (crías que superan una edad configurable, ej. 8 meses, sin destete registrado) como parte del calendario reproductivo.

### US-6: Calendario reproductivo

Como usuario, quiero ver de un vistazo los eventos reproductivos próximos y vencidos.

**Criterios de aceptación**

1. EL SISTEMA DEBE mostrar una vista de calendario/línea de tiempo con: celos esperados, diagnósticos de preñez pendientes, partos próximos, destetes sugeridos — todos calculados en base a los eventos ya registrados.
2. EL SISTEMA DEBE generar alertas (visibles en dashboard y, si está configurado, por notificación) para eventos vencidos sin acción registrada (ej. diagnóstico de preñez que ya debería haberse hecho).
