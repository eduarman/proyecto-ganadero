import { http } from '../../../shared/api/http';
import type { AnimalMovimiento } from '../../ganado/services/ganado.api';

export type EstadoPotrero = 'ACTIVO' | 'INACTIVO';

export interface Potrero {
  id: string;
  tenantId: string;
  nombre: string;
  areaHectareas: string;
  tipoPasto: string | null;
  capacidadCarga: string | null;
  estado: EstadoPotrero;
  ocupacionActual: number;
  diasDescanso: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CrearPotreroPayload {
  nombre: string;
  areaHectareas: number;
  tipoPasto?: string;
  capacidadCarga?: number;
}

export const potrerosApi = {
  listar() {
    return http.get<Potrero[]>('/potreros').then((r) => r.data);
  },
  obtener(id: string) {
    return http.get<Potrero>(`/potreros/${id}`).then((r) => r.data);
  },
  crear(payload: CrearPotreroPayload) {
    return http.post<Potrero>('/potreros', payload).then((r) => r.data);
  },
  actualizar(id: string, payload: Partial<CrearPotreroPayload>) {
    return http.patch<Potrero>(`/potreros/${id}`, payload).then((r) => r.data);
  },
  inactivar(id: string) {
    return http.patch<Potrero>(`/potreros/${id}/inactivar`);
  },
  activar(id: string) {
    return http.patch<Potrero>(`/potreros/${id}/activar`);
  },
  movimientos(id: string) {
    return http.get<AnimalMovimiento[]>(`/potreros/${id}/movimientos`).then((r) => r.data);
  },
};
