// Los campos de fecha "de calendario" del backend (fecha de registro, de
// nacimiento, de movimiento, etc.) se guardan como medianoche UTC del día
// elegido — nunca representan un instante con hora real. Formatearlos con
// `toLocaleDateString` sin fijar `timeZone: 'UTC'` deja que el navegador
// aplique SU huso horario: para cualquier usuario detrás de UTC (todo
// Latinoamérica), la medianoche UTC del día D cae en la tarde/noche local
// del día D-1, mostrando la fecha equivocada. Estas dos funciones fuerzan
// UTC al leer, recuperando siempre el día que el usuario eligió.

export function formatFechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', timeZone: 'UTC' });
}

export function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', { timeZone: 'UTC' });
}

const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// Para DayBadge.vue: mismo motivo que formatFecha* — usa los componentes UTC
// del Date, no los locales (getUTCDate/getUTCMonth, no getDate/getMonth).
export function diaMesCorto(iso: string): { day: string; month: string } {
  const fecha = new Date(iso);
  return { day: String(fecha.getUTCDate()).padStart(2, '0'), month: MESES_CORTO[fecha.getUTCMonth()] };
}
