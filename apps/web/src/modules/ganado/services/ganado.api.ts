import { http } from '../../../shared/api/http';

export type Especie = 'BOVINO' | 'BUFALINO';
export type SexoAnimal = 'MACHO' | 'HEMBRA';
export type EstadoAnimal = 'ACTIVO' | 'VENDIDO' | 'MUERTO' | 'EN_TRANSITO' | 'INACTIVO';
export type MotivoBaja = 'VENTA' | 'MUERTE' | 'TRASLADO' | 'OTRO';

export interface AnimalResumen {
  id: string;
  identificador: string;
}

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
  madreId: string | null;
  padreId: string | null;
  madreRefExterna: string | null;
  padreRefExterna: string | null;
  fotoUrl: string | null;
  potreroActualId: string | null;
  estado: EstadoAnimal;
  createdAt: string;
  updatedAt: string;
  // Solo presentes al pedir la ficha individual (GET /ganado/:id).
  madre?: AnimalResumen | null;
  padre?: AnimalResumen | null;
}

export interface CrearAnimalPayload {
  identificador: string;
  especie: Especie;
  sexo: SexoAnimal;
  fechaNacimiento?: string;
  raza?: string;
  color?: string;
  madreId?: string;
  padreId?: string;
  madreRefExterna?: string;
  padreRefExterna?: string;
  potreroActualId?: string;
}

export interface AnimalMovimiento {
  id: string;
  tenantId: string;
  animalId: string;
  potreroOrigenId: string | null;
  potreroDestinoId: string;
  fecha: string;
  usuarioId: string;
  createdAt: string;
  animal?: AnimalResumen;
  potreroOrigen: { id: string; nombre: string } | null;
  potreroDestino: { id: string; nombre: string };
}

export interface MoverAnimalesPayload {
  animalIds: string[];
  potreroDestinoId: string;
  fecha: string;
}

export interface ResultadoImportacion {
  creados: number;
  errores: { fila: number; motivo: string }[];
}

export interface ListaAnimales {
  data: Animal[];
  total: number;
  page: number;
  limit: number;
}

export interface ListarAnimalesParams {
  page?: number;
  limit?: number;
  search?: string;
  estado?: EstadoAnimal;
  sexo?: SexoAnimal;
  potreroActualId?: string;
  edadMinMeses?: number;
  edadMaxMeses?: number;
}

export interface DarBajaPayload {
  motivo: MotivoBaja;
  fecha: string;
  observaciones?: string;
  confirmarConEventosPendientes?: boolean;
}

export const ganadoApi = {
  listar(params: ListarAnimalesParams = {}) {
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
  darBaja(id: string, payload: DarBajaPayload) {
    return http.post(`/ganado/${id}/baja`, payload);
  },
  moverAnimales(payload: MoverAnimalesPayload) {
    return http.post<AnimalMovimiento[]>('/ganado/movimientos', payload).then((r) => r.data);
  },
  movimientosDeAnimal(id: string) {
    return http.get<AnimalMovimiento[]>(`/ganado/${id}/movimientos`).then((r) => r.data);
  },
  descargarPlantillaImportacion() {
    return http.get('/ganado/plantilla-importacion', { responseType: 'blob' }).then((r) => r.data as Blob);
  },
  importar(archivo: File) {
    const formData = new FormData();
    formData.append('file', archivo);
    return http.post<ResultadoImportacion>('/ganado/importar', formData).then((r) => r.data);
  },
};
