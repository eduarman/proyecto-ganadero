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

export type MonedaTrabajador = 'USD' | 'VES';

export interface Adelanto {
  id: string;
  tenantId: string;
  trabajadorId: string;
  fecha: string;
  monto: string;
  moneda: MonedaTrabajador;
  tasaCambio: string | null;
  montoEquivalenteUsd: string | null;
  motivo: string;
  metodoEntrega: string | null;
  observaciones: string | null;
  montoDescontado: string;
  registradoPorId: string;
  createdAt: string;
  saldoPendiente: number;
}

export interface CrearAdelantoPayload {
  fecha: string;
  monto: number;
  moneda: MonedaTrabajador;
  tasaCambio?: number;
  motivo: string;
  metodoEntrega?: string;
  observaciones?: string;
}

export interface PrestamoAbono {
  id: string;
  prestamoId: string;
  fecha: string;
  monto: string;
  observaciones: string | null;
  createdAt: string;
}

export interface Prestamo {
  id: string;
  tenantId: string;
  trabajadorId: string;
  fecha: string;
  montoOriginal: string;
  moneda: MonedaTrabajador;
  tasaCambio: string | null;
  montoEquivalenteUsd: string | null;
  numeroCuotas: number;
  valorCuota: string;
  fechaInicio: string;
  observaciones: string | null;
  registradoPorId: string;
  createdAt: string;
  abonos: PrestamoAbono[];
  totalPagado: number;
  saldoPendiente: number;
  cuotasPagadas: number;
}

export interface CrearPrestamoPayload {
  fecha: string;
  montoOriginal: number;
  moneda: MonedaTrabajador;
  tasaCambio?: number;
  numeroCuotas: number;
  valorCuota: number;
  fechaInicio: string;
  observaciones?: string;
}

export interface CrearAbonoPrestamoPayload {
  fecha: string;
  monto: number;
  observaciones?: string;
}

export type TipoPago = 'SALARIO' | 'JORNAL' | 'POR_ACTIVIDAD' | 'BONO' | 'COMISION' | 'OTRO';

export interface Pago {
  id: string;
  tenantId: string;
  trabajadorId: string;
  tipo: TipoPago;
  periodoDesde: string;
  periodoHasta: string;
  montoBase: string;
  bonificaciones: string;
  adelantosDescontados: string;
  prestamosDescontados: string;
  otrosDescuentos: string;
  montoTotal: string;
  moneda: MonedaTrabajador;
  tasaCambio: string | null;
  montoEquivalenteUsd: string | null;
  detalleJson: unknown;
  fecha: string;
  observaciones: string | null;
  confirmadoPorId: string;
  createdAt: string;
}

export interface PrevisualizarPagoPayload {
  tipo: TipoPago;
  periodoDesde: string;
  periodoHasta: string;
}

export interface PrevisualizacionPago {
  jornadas: number;
  horasTrabajadas: number;
  jornalesRealizados: number;
  montoBaseSugerido: number;
  adelantosPendientes: Adelanto[];
  prestamosPendientes: Prestamo[];
}

export interface DescuentoAdelantoPayload {
  adelantoId: string;
  monto: number;
}

export interface DescuentoPrestamoPayload {
  prestamoId: string;
  monto: number;
}

export interface ConfirmarPagoPayload {
  tipo: TipoPago;
  periodoDesde: string;
  periodoHasta: string;
  montoBase: number;
  bonificaciones?: number;
  otrosDescuentos?: number;
  moneda: MonedaTrabajador;
  tasaCambio?: number;
  adelantos?: DescuentoAdelantoPayload[];
  prestamos?: DescuentoPrestamoPayload[];
  fecha: string;
  observaciones?: string;
  confirmar?: boolean;
}

export type TipoReporteTrabajador = 'trabajadores' | 'asistencia' | 'pagos' | 'costo-laboral';
export type FormatoReporteTrabajador = 'xlsx' | 'pdf' | 'csv';

export interface TablaReporteTrabajador {
  titulo: string;
  columnas: string[];
  filas: (string | number)[][];
}

export interface DatosReporteTrabajador {
  tipo: TipoReporteTrabajador;
  generadoEn: string;
  filtros: { desde?: string; hasta?: string };
  resumen: Record<string, string | number>;
  tablas: TablaReporteTrabajador[];
}

export interface FiltrosReporteTrabajadorParams {
  desde?: string;
  hasta?: string;
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
  listarAdelantos(trabajadorId: string) {
    return http.get<Adelanto[]>(`/trabajadores/${trabajadorId}/adelantos`).then((r) => r.data);
  },
  crearAdelanto(trabajadorId: string, payload: CrearAdelantoPayload) {
    return http.post<Adelanto>(`/trabajadores/${trabajadorId}/adelantos`, payload).then((r) => r.data);
  },
  listarPrestamos(trabajadorId: string) {
    return http.get<Prestamo[]>(`/trabajadores/${trabajadorId}/prestamos`).then((r) => r.data);
  },
  crearPrestamo(trabajadorId: string, payload: CrearPrestamoPayload) {
    return http.post<Prestamo>(`/trabajadores/${trabajadorId}/prestamos`, payload).then((r) => r.data);
  },
  crearAbonoPrestamo(prestamoId: string, payload: CrearAbonoPrestamoPayload) {
    return http.post<PrestamoAbono>(`/trabajadores/prestamos/${prestamoId}/abonos`, payload).then((r) => r.data);
  },
  listarPagos(trabajadorId: string) {
    return http.get<Pago[]>(`/trabajadores/${trabajadorId}/pagos`).then((r) => r.data);
  },
  previsualizarPago(trabajadorId: string, payload: PrevisualizarPagoPayload) {
    return http
      .post<PrevisualizacionPago>(`/trabajadores/${trabajadorId}/pagos/previsualizar`, payload)
      .then((r) => r.data);
  },
  confirmarPago(trabajadorId: string, payload: ConfirmarPagoPayload) {
    return http.post<Pago>(`/trabajadores/${trabajadorId}/pagos`, payload).then((r) => r.data);
  },
  obtenerReporte(tipo: TipoReporteTrabajador, params: FiltrosReporteTrabajadorParams = {}) {
    return http.get<DatosReporteTrabajador>(`/trabajadores/reportes/${tipo}`, { params }).then((r) => r.data);
  },
  exportarReporte(tipo: TipoReporteTrabajador, formato: FormatoReporteTrabajador, params: FiltrosReporteTrabajadorParams = {}) {
    return http
      .get(`/trabajadores/reportes/${tipo}/exportar`, { params: { ...params, formato }, responseType: 'blob' })
      .then((r) => r.data as Blob);
  },
};
