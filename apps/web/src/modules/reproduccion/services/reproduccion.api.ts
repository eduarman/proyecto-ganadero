import { http } from '../../../shared/api/http';
import type { Animal } from '../../ganado/services/ganado.api';

export type TipoServicio = 'MONTA_NATURAL' | 'IA' | 'TE';
export type EstadoServicio = 'PENDIENTE_DIAGNOSTICO' | 'CONFIRMADO_PRENADA' | 'VACIO';
export type ResultadoDiagnostico = 'PRENADA' | 'VACIA' | 'DUDOSO';
export type MetodoDiagnostico = 'PALPACION' | 'ECOGRAFIA' | 'OTRO';
export type TipoParto = 'NORMAL' | 'DISTOCICO' | 'CESAREA';

export interface Servicio {
  id: string;
  tenantId: string;
  animalId: string;
  tipo: TipoServicio;
  fecha: string;
  machoId: string | null;
  semenReferencia: string | null;
  estado: EstadoServicio;
  fechaEstimadaDiagnostico: string;
  fechaProbableParto: string;
  animal: Animal;
}

export interface CrearServicioPayload {
  animalId: string;
  tipo: TipoServicio;
  fecha: string;
  machoId?: string;
  semenReferencia?: string;
  confirmarDuplicado?: boolean;
}

export interface CrearDiagnosticoPayload {
  servicioId: string;
  resultado: ResultadoDiagnostico;
  metodo: MetodoDiagnostico;
  fecha: string;
}

export interface CrearPartoPayload {
  madreId: string;
  fecha: string;
  tipo: TipoParto;
  servicioId?: string;
  mortinato?: boolean;
  observaciones?: string;
  criaIdentificador?: string;
  criaSexo?: 'MACHO' | 'HEMBRA';
}

export const reproduccionApi = {
  crearServicio(payload: CrearServicioPayload) {
    return http.post<Servicio>('/reproduccion/servicios', payload).then((r) => r.data);
  },
  crearDiagnostico(payload: CrearDiagnosticoPayload) {
    return http.post('/reproduccion/diagnosticos', payload);
  },
  crearParto(payload: CrearPartoPayload) {
    return http.post('/reproduccion/partos', payload);
  },
  calendario() {
    return http.get<Servicio[]>('/reproduccion/calendario').then((r) => r.data);
  },
  pendientesDiagnostico() {
    return http.get<Servicio[]>('/reproduccion/servicios/pendientes').then((r) => r.data);
  },
  listarServicios(animalId?: string) {
    return http.get<Servicio[]>('/reproduccion/servicios', { params: { animalId } }).then((r) => r.data);
  },
};
