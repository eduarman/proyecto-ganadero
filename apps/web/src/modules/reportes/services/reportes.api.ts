import { http } from '../../../shared/api/http';

export type TipoReporte =
  | 'INVENTARIO_GANADO'
  | 'NATALIDAD_MORTALIDAD'
  | 'PRODUCCION'
  | 'COSTOS_ALIMENTACION'
  | 'CUMPLIMIENTO_SANITARIO'
  | 'OCUPACION_POTREROS'
  | 'COSTO_VS_PRODUCCION';

export type FormatoReporte = 'PDF' | 'XLSX';
export type EstadoReporte = 'PENDIENTE' | 'GENERANDO' | 'LISTO' | 'ERROR';

export interface TipoReporteInfo {
  tipo: TipoReporte;
  nombre: string;
  descripcion: string;
}

export interface CatalogoReportes {
  tipos: TipoReporteInfo[];
  consolidadoDisponible: boolean;
}

export interface FiltrosReporte {
  desde?: string;
  hasta?: string;
  potreroId?: string;
}

export interface TablaReporte {
  titulo: string;
  columnas: string[];
  filas: (string | number)[][];
}

export interface DatosReporte {
  tipo: TipoReporte;
  generadoEn: string;
  filtros: FiltrosReporte;
  resumen: Record<string, string | number>;
  tablas: TablaReporte[];
}

export interface ReporteGenerado {
  id: string;
  tenantId: string;
  tipo: TipoReporte;
  formato: FormatoReporte;
  estado: EstadoReporte;
  archivoPath: string | null;
  errorMensaje: string | null;
  createdAt: string;
  completadoEn: string | null;
  archivoUrl?: string | null;
}

export interface ConsolidadoReporte {
  tipo: TipoReporte;
  negocios: { negocioId: string; negocioNombre: string; datos: DatosReporte }[];
}

export const reportesApi = {
  tipos() {
    return http.get<CatalogoReportes>('/reportes/tipos').then((r) => r.data);
  },
  generar(tipo: TipoReporte, formato: FormatoReporte, filtros?: FiltrosReporte) {
    return http
      .post<ReporteGenerado>(`/reportes/${tipo.toLowerCase()}/generar`, { formato, filtros })
      .then((r) => r.data);
  },
  obtenerGenerado(id: string) {
    return http.get<ReporteGenerado>(`/reportes/generados/${id}`).then((r) => r.data);
  },
  listarGenerados() {
    return http.get<ReporteGenerado[]>('/reportes/generados').then((r) => r.data);
  },
  consolidado(tipo: TipoReporte, filtros?: FiltrosReporte) {
    return http.post<ConsolidadoReporte>('/reportes/consolidado', { tipo: tipo.toLowerCase(), filtros }).then((r) => r.data);
  },
};
