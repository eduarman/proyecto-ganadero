import { http } from '../../../shared/api/http';

export type EstadoInsumo = 'ACTIVO' | 'INACTIVO';
export type TipoPlanAlimentacion = 'PASTOREO' | 'SUPLEMENTACION' | 'ESTABULADO' | 'MIXTO';
export type UnidadTiempoPlan = 'DIA' | 'SEMANA';
export type DestinoPlanItem = 'ANIMAL' | 'LOTE';

export interface Insumo {
  id: string;
  tenantId: string;
  nombre: string;
  unidadMedida: string;
  costoUnitario: string | null;
  estado: EstadoInsumo;
  createdAt: string;
}

export interface CrearInsumoPayload {
  nombre: string;
  unidadMedida: string;
  costoUnitario?: number;
}

export interface PlanItem {
  id: string;
  planId: string;
  insumoId: string;
  cantidad: string;
  unidadTiempo: UnidadTiempoPlan;
  por: DestinoPlanItem;
  insumo: Insumo;
}

export interface Plan {
  id: string;
  tenantId: string;
  nombre: string;
  tipo: TipoPlanAlimentacion;
  estado: string;
  createdAt: string;
  items: PlanItem[];
}

export interface CrearPlanPayload {
  nombre: string;
  tipo: TipoPlanAlimentacion;
  items: { insumoId: string; cantidad: number; unidadTiempo: UnidadTiempoPlan; por: DestinoPlanItem }[];
}

export interface CrearAsignacionPayload {
  potreroId?: string;
  animalIds?: string[];
  fechaInicio: string;
  fechaFin?: string;
}

export interface Suministro {
  id: string;
  tenantId: string;
  fecha: string;
  insumoId: string;
  potreroId: string | null;
  animalIds: string[];
  cantidad: string;
  registradoPorId: string;
  createdAt: string;
  insumo: Insumo;
  potrero: { id: string; nombre: string } | null;
}

export interface CrearSuministroPayload {
  fecha: string;
  insumoId: string;
  potreroId?: string;
  animalIds?: string[];
  cantidad: number;
}

export interface CostoPorInsumo {
  insumoId: string;
  nombre: string;
  cantidad: number;
  costoUnitario: number | null;
  costoTotal: number | null;
}

export interface Costos {
  porTipo: CostoPorInsumo[];
  consumoTotalKg: number;
  costoTotalGeneral: number;
  costoParcial: boolean;
  consumoPromedioPorAnimal: number;
}

export const alimentacionApi = {
  listarInsumos() {
    return http.get<Insumo[]>('/alimentacion/insumos').then((r) => r.data);
  },
  crearInsumo(payload: CrearInsumoPayload) {
    return http.post<Insumo>('/alimentacion/insumos', payload).then((r) => r.data);
  },
  inactivarInsumo(id: string) {
    return http.patch<Insumo>(`/alimentacion/insumos/${id}/inactivar`);
  },
  activarInsumo(id: string) {
    return http.patch<Insumo>(`/alimentacion/insumos/${id}/activar`);
  },
  listarPlanes() {
    return http.get<Plan[]>('/alimentacion/planes').then((r) => r.data);
  },
  crearPlan(payload: CrearPlanPayload) {
    return http.post<Plan>('/alimentacion/planes', payload).then((r) => r.data);
  },
  crearAsignacion(planId: string, payload: CrearAsignacionPayload) {
    return http.post(`/alimentacion/planes/${planId}/asignaciones`, payload);
  },
  listarSuministros() {
    return http.get<Suministro[]>('/alimentacion/suministros').then((r) => r.data);
  },
  crearSuministro(payload: CrearSuministroPayload) {
    return http.post<Suministro>('/alimentacion/suministros', payload).then((r) => r.data);
  },
  costos() {
    return http.get<Costos>('/alimentacion/costos').then((r) => r.data);
  },
};
