import { http } from '../../../shared/api/http';

export type Especie = 'BOVINO' | 'BUFALINO';
export type SexoAnimal = 'MACHO' | 'HEMBRA';
export type EstadoAnimal = 'ACTIVO' | 'VENDIDO' | 'MUERTO' | 'EN_TRANSITO' | 'INACTIVO';
export type MotivoBaja = 'VENTA' | 'MUERTE' | 'TRASLADO' | 'OTRO';

export interface Animal {
  id: string;
  tenantId: string;
  identificador: string;
  especie: Especie;
  sexo: SexoAnimal;
  fechaNacimiento: string | null;
  categoria: string | null;
  raza: string | null;
  color: string | null;
  pesoNacimiento: string | null;
  madreRefExterna: string | null;
  padreRefExterna: string | null;
  fotoUrl: string | null;
  potreroActualId: string | null;
  estado: EstadoAnimal;
  createdAt: string;
  updatedAt: string;
}

export interface CrearAnimalPayload {
  identificador: string;
  especie: Especie;
  sexo: SexoAnimal;
  fechaNacimiento?: string;
  raza?: string;
  color?: string;
  madreRefExterna?: string;
  padreRefExterna?: string;
  potreroActualId?: string;
}

export interface ListaAnimales {
  data: Animal[];
  total: number;
  page: number;
  limit: number;
}

export const ganadoApi = {
  listar(params: { limit?: number; search?: string } = {}) {
    return http.get<ListaAnimales>('/ganado', { params }).then((r) => r.data);
  },
  obtener(id: string) {
    return http.get<Animal>(`/ganado/${id}`).then((r) => r.data);
  },
  crear(payload: CrearAnimalPayload) {
    return http.post<Animal>('/ganado', payload).then((r) => r.data);
  },
  actualizar(id: string, payload: Partial<CrearAnimalPayload>) {
    return http.patch<Animal>(`/ganado/${id}`, payload).then((r) => r.data);
  },
  darBaja(id: string, payload: { motivo: MotivoBaja; fecha: string; observaciones?: string }) {
    return http.post(`/ganado/${id}/baja`, payload);
  },
};
