import { http } from '../../../shared/api/http';

export type TurnoOrdenio = 'MANANA' | 'TARDE' | 'UNICO';

export interface RegistroLeche {
  id: string;
  tenantId: string;
  animalId: string;
  fecha: string;
  turno: TurnoOrdenio;
  litros: string;
  registradoPor: string;
  createdAt: string;
  animal: { id: string; identificador: string };
}

export interface CrearRegistroLechePayload {
  animalId: string;
  fecha: string;
  turno: TurnoOrdenio;
  litros: number;
}

export interface RegistroLecheTotal {
  id: string;
  tenantId: string;
  fecha: string;
  turno: TurnoOrdenio;
  litrosTotal: string;
  registradoPor: string;
  createdAt: string;
}

export interface CrearRegistroTotalPayload {
  fecha: string;
  turno: TurnoOrdenio;
  litrosTotal: number;
}

export interface IndicadoresProduccion {
  totalHoy: number;
  promedioHoy: number;
  animalesHoy: number;
  variacionMensualPct: number | null;
  meses: { mes: string; total: number }[];
}

export const produccionApi = {
  listar(animalId?: string) {
    return http.get<RegistroLeche[]>('/produccion/leche', { params: { animalId } }).then((r) => r.data);
  },
  registrarLeche(payload: CrearRegistroLechePayload) {
    return http.post<RegistroLeche>('/produccion/leche', payload).then((r) => r.data);
  },
  indicadores() {
    return http.get<IndicadoresProduccion>('/produccion/indicadores').then((r) => r.data);
  },
  listarTotales() {
    return http.get<RegistroLecheTotal[]>('/produccion/leche/total').then((r) => r.data);
  },
  registrarTotal(payload: CrearRegistroTotalPayload) {
    return http.post<RegistroLecheTotal>('/produccion/leche/total', payload).then((r) => r.data);
  },
};
