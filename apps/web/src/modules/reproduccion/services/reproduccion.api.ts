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

export interface Celo {
  id: string;
  tenantId: string;
  animalId: string;
  fecha: string;
  observaciones: string | null;
  animal: Animal;
}

export interface CrearCeloPayload {
  animalId: string;
  fecha: string;
  observaciones?: string;
}

export interface Destete {
  id: string;
  tenantId: string;
  animalId: string;
  fecha: string;
  pesoDestete: string | null;
  animal: Animal;
}

export interface CrearDestetePayload {
  animalId: string;
  fecha: string;
  pesoDestete?: number;
}

export interface DiagnosticoPendiente extends Servicio {
  vencido: boolean;
}

export interface CeloEsperado {
  id: string;
  animal: { id: string; identificador: string };
  fechaEsperada: string;
  vencido: boolean;
}

export interface DesteteSugerido {
  id: string;
  identificador: string;
  fechaNacimiento: string;
  edadDias: number;
}

export interface CalendarioReproductivo {
  partosProximos: Servicio[];
  diagnosticosPendientes: DiagnosticoPendiente[];
  celosEsperados: CeloEsperado[];
  destetesSugeridos: DesteteSugerido[];
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
  crearCelo(payload: CrearCeloPayload) {
    return http.post<Celo>('/reproduccion/celos', payload).then((r) => r.data);
  },
  crearDestete(payload: CrearDestetePayload) {
    return http.post<Destete>('/reproduccion/destetes', payload).then((r) => r.data);
  },
  calendario() {
    return http.get<CalendarioReproductivo>('/reproduccion/calendario').then((r) => r.data);
  },
  pendientesDiagnostico() {
    return http.get<Servicio[]>('/reproduccion/servicios/pendientes').then((r) => r.data);
  },
  listarServicios(animalId?: string) {
    return http.get<Servicio[]>('/reproduccion/servicios', { params: { animalId } }).then((r) => r.data);
  },
};
