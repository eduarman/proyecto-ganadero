import { TipoReporte } from '@prisma/client';

export interface TablaReporte {
  titulo: string;
  columnas: string[];
  filas: (string | number)[][];
}

export interface DatosReporte {
  tipo: TipoReporte | string;
  generadoEn: string;
  filtros: { desde?: string; hasta?: string; potreroId?: string };
  resumen: Record<string, string | number>;
  tablas: TablaReporte[];
}

export const TIPOS_REPORTE: { tipo: TipoReporte; nombre: string; descripcion: string }[] = [
  { tipo: 'INVENTARIO_GANADO', nombre: 'Inventario de ganado', descripcion: 'Animales por categoría, potrero y estado.' },
  { tipo: 'NATALIDAD_MORTALIDAD', nombre: 'Natalidad y mortalidad', descripcion: 'Nacimientos y bajas por muerte, por mes.' },
  { tipo: 'PRODUCCION', nombre: 'Producción de leche', descripcion: 'Litros producidos por mes en el rango seleccionado.' },
  { tipo: 'COSTOS_ALIMENTACION', nombre: 'Costos de alimentación', descripcion: 'Costo por insumo en el rango seleccionado.' },
  { tipo: 'CUMPLIMIENTO_SANITARIO', nombre: 'Cumplimiento sanitario', descripcion: 'Vacunación/tratamientos al día vs. atrasados.' },
  { tipo: 'OCUPACION_POTREROS', nombre: 'Ocupación de potreros', descripcion: 'Clasificación de potreros según su carga actual.' },
  { tipo: 'COSTO_VS_PRODUCCION', nombre: 'Costo vs. producción', descripcion: 'Costo de alimentación relativo a los litros producidos.' },
];
