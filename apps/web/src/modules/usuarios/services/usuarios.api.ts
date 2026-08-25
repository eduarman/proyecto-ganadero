import { http } from '../../../shared/api/http';
import type { RolUsuario } from '../../auth/services/auth.api';

export type RolInvitable = Exclude<RolUsuario, 'SUPER_ADMIN' | 'ADMIN_NEGOCIO'>;

export interface UsuarioDelNegocio {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
}

export interface InvitacionPendiente {
  id: string;
  email: string;
  rol: RolUsuario;
  expiraEn: string;
}

export interface UsoPlan {
  actual: number;
  limite: number;
}

export interface ListaUsuarios {
  usuarios: UsuarioDelNegocio[];
  invitacionesPendientes: InvitacionPendiente[];
  usoPlan: UsoPlan;
}

export interface CrearInvitacionPayload {
  email: string;
  rol: RolInvitable;
}

export interface PrevisualizacionInvitacion {
  negocioNombre: string;
  rol: RolUsuario;
  email: string;
  usuarioExistente: boolean;
}

export interface AceptarInvitacionPayload {
  nombre?: string;
  password?: string;
}

export const usuariosApi = {
  listar() {
    return http.get<ListaUsuarios>('/usuarios').then((r) => r.data);
  },
  invitar(payload: CrearInvitacionPayload) {
    return http.post('/usuarios/invitaciones', payload);
  },
  reenviarInvitacion(id: string) {
    return http.post(`/usuarios/invitaciones/${id}/reenviar`);
  },
  cancelarInvitacion(id: string) {
    return http.delete(`/usuarios/invitaciones/${id}`);
  },
  cambiarRol(usuarioId: string, rol: RolInvitable) {
    return http.patch(`/usuarios/${usuarioId}/rol`, { rol });
  },
  desactivar(usuarioId: string) {
    return http.patch(`/usuarios/${usuarioId}/desactivar`);
  },
  previsualizarInvitacion(token: string) {
    return http.get<PrevisualizacionInvitacion>(`/invitaciones/${token}`).then((r) => r.data);
  },
  aceptarInvitacion(token: string, payload: AceptarInvitacionPayload) {
    return http.post(`/invitaciones/${token}/aceptar`, payload);
  },
};
