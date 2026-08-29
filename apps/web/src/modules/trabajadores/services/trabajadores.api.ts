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

export type EstadoAsignacion = 'VIGENTE' | 'FINALIZADA';

export interface Asignacion {
  id: string;
  tenantId: string;
  trabajadorId: string;
  cargoId: string | null;
  potreroId: string | null;
  cargo: Cargo | null;
  potrero: { id: string; nombre: string } | null;
  fechaInicio: string;
  fechaFin: string | null;
  observaciones: string | null;
  createdAt: string;
  estado: EstadoAsignacion;
}

export interface CrearAsignacionPayload {
  cargoId?: string;
  potreroId?: string;
  fechaInicio: string;
  fechaFin?: string;
  observaciones?: string;
}

export interface FinalizarAsignacionPayload {
  fechaFin?: string;
}

export type EstadoAsistencia =
  | 'PRESENTE'
  | 'AUSENTE'
  | 'PERMISO'
  | 'VACACIONES'
  | 'FALTA_JUSTIFICADA'
  | 'FALTA_INJUSTIFICADA';

export interface Asistencia {
  id: string;
  tenantId: string;
  trabajadorId: string;
  fecha: string;
  estado: EstadoAsistencia;
  horaEntrada: string | null;
  horaSalida: string | null;
  tipoJornada: string | null;
  jornalRealizado: string | null;
  observaciones: string | null;
  registradoPorId: string;
  createdAt: string;
  horasTrabajadas: number | null;
}

export interface CrearAsistenciaPayload {
  fecha: string;
  estado: EstadoAsistencia;
  horaEntrada?: string;
  horaSalida?: string;
  tipoJornada?: string;
  jornalRealizado?: number;
  observaciones?: string;
  confirmar?: boolean;
}

export interface AsistenciaDelDia {
  trabajador: Trabajador;
  asistencia: Asistencia | null;
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
  listarAsignaciones(trabajadorId: string) {
    return http.get<Asignacion[]>(`/trabajadores/${trabajadorId}/asignaciones`).then((r) => r.data);
  },
  crearAsignacion(trabajadorId: string, payload: CrearAsignacionPayload) {
    return http.post<Asignacion>(`/trabajadores/${trabajadorId}/asignaciones`, payload).then((r) => r.data);
  },
  finalizarAsignacion(asignacionId: string, payload: FinalizarAsignacionPayload = {}) {
    return http.patch<Asignacion>(`/trabajadores/asignaciones/${asignacionId}/finalizar`, payload).then((r) => r.data);
  },
  listarAsistencias(trabajadorId: string) {
    return http.get<Asistencia[]>(`/trabajadores/${trabajadorId}/asistencias`).then((r) => r.data);
  },
  crearAsistencia(trabajadorId: string, payload: CrearAsistenciaPayload) {
    return http.post<Asistencia>(`/trabajadores/${trabajadorId}/asistencias`, payload).then((r) => r.data);
  },
  listarAsistenciaDelDia(fecha: string) {
    return http.get<AsistenciaDelDia[]>('/trabajadores/asistencias/dia', { params: { fecha } }).then((r) => r.data);
  },
};
