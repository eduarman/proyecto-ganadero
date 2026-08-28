import { http } from '../../../shared/api/http';

export type EstadoCargo = 'ACTIVO' | 'INACTIVO';
export type EstadoTrabajador = 'ACTIVO' | 'INACTIVO';
export type TipoContratacion = 'MENSUAL' | 'JORNAL' | 'POR_ACTIVIDAD' | 'TEMPORAL' | 'OTRO';
export type ModalidadPago = 'MENSUAL' | 'SEMANAL' | 'QUINCENAL' | 'DIARIO' | 'POR_ACTIVIDAD';

export interface Cargo {
  id: string;
  tenantId: string;
  nombre: string;
  estado: EstadoCargo;
  createdAt: string;
}

export interface CrearCargoPayload {
  nombre: string;
}

export interface Trabajador {
  id: string;
  tenantId: string;
  nombres: string;
  apellidos: string;
  documento: string;
  fechaNacimiento: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  contactoEmergenciaNombre: string | null;
  contactoEmergenciaTelefono: string | null;
  cargoId: string;
  cargo: Cargo;
  fechaIngreso: string;
  tipoContratacion: TipoContratacion;
  modalidadPago: ModalidadPago;
  salarioOJornal: string;
  estado: EstadoTrabajador;
  createdAt: string;
  updatedAt: string;
}

export interface TrabajadorConAntiguedad extends Trabajador {
  antiguedad: { anios: number; meses: number };
}

export interface CrearTrabajadorPayload {
  nombres: string;
  apellidos: string;
  documento: string;
  cargoId: string;
  fechaIngreso: string;
  tipoContratacion: TipoContratacion;
  modalidadPago: ModalidadPago;
  salarioOJornal: number;
  fechaNacimiento?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  contactoEmergenciaNombre?: string;
  contactoEmergenciaTelefono?: string;
}

export type ActualizarTrabajadorPayload = Partial<CrearTrabajadorPayload>;

export interface ListarTrabajadoresParams {
  page?: number;
  limit?: number;
  estado?: EstadoTrabajador;
  cargoId?: string;
  search?: string;
}

export interface ListaTrabajadores {
  data: Trabajador[];
  total: number;
  page: number;
  limit: number;
}

export const trabajadoresApi = {
  listarCargos() {
    return http.get<Cargo[]>('/trabajadores/cargos').then((r) => r.data);
  },
  crearCargo(payload: CrearCargoPayload) {
    return http.post<Cargo>('/trabajadores/cargos', payload).then((r) => r.data);
  },
  activarCargo(id: string) {
    return http.patch<Cargo>(`/trabajadores/cargos/${id}/activar`);
  },
  inactivarCargo(id: string) {
    return http.patch<Cargo>(`/trabajadores/cargos/${id}/inactivar`);
  },
  listar(params: ListarTrabajadoresParams = {}) {
    return http.get<ListaTrabajadores>('/trabajadores', { params }).then((r) => r.data);
  },
  crear(payload: CrearTrabajadorPayload) {
    return http.post<Trabajador>('/trabajadores', payload).then((r) => r.data);
  },
  obtener(id: string) {
    return http.get<TrabajadorConAntiguedad>(`/trabajadores/${id}`).then((r) => r.data);
  },
  actualizar(id: string, payload: ActualizarTrabajadorPayload) {
    return http.patch<Trabajador>(`/trabajadores/${id}`, payload).then((r) => r.data);
  },
  activar(id: string) {
    return http.patch<Trabajador>(`/trabajadores/${id}/activar`);
  },
  inactivar(id: string) {
    return http.patch<Trabajador>(`/trabajadores/${id}/inactivar`);
  },
};
