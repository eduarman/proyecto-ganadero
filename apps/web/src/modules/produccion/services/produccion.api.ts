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

export interface CrearRegistroLecheLotePayload {
  fecha: string;
  turno: TurnoOrdenio;
  registros: { animalId: string; litros: number }[];
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

export interface RegistroPeso {
  id: string;
  tenantId: string;
  animalId: string;
  fecha: string;
  pesoKg: string;
  registradoPor: string;
  createdAt: string;
  animal: { id: string; identificador: string };
}

export interface CrearRegistroPesoPayload {
  animalId: string;
  fecha: string;
  pesoKg: number;
}

export interface CrearRegistroPesoLotePayload {
  fecha: string;
  registros: { animalId: string; pesoKg: number }[];
}

export interface RegistroGdp {
  id: string;
  fecha: string;
  pesoKg: string;
  gdpKgDia: number | null;
}

export const produccionApi = {
  listar(animalId?: string) {
    return http.get<RegistroLeche[]>('/produccion/leche', { params: { animalId } }).then((r) => r.data);
  },
  registrarLeche(payload: CrearRegistroLechePayload) {
    return http.post<RegistroLeche>('/produccion/leche', payload).then((r) => r.data);
  },
  registrarLecheLote(payload: CrearRegistroLecheLotePayload) {
    return http.post<RegistroLeche[]>('/produccion/leche/lote', payload).then((r) => r.data);
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
  listarPesos(animalId?: string) {
    return http.get<RegistroPeso[]>('/produccion/peso', { params: { animalId } }).then((r) => r.data);
  },
  registrarPeso(payload: CrearRegistroPesoPayload) {
    return http.post<RegistroPeso>('/produccion/peso', payload).then((r) => r.data);
  },
  registrarPesoLote(payload: CrearRegistroPesoLotePayload) {
    return http.post<RegistroPeso[]>('/produccion/peso/lote', payload).then((r) => r.data);
  },
  gdp(animalId: string) {
    return http.get<RegistroGdp[]>(`/produccion/peso/gdp/${animalId}`).then((r) => r.data);
  },
};
