import { http } from '../../../shared/api/http';

export type RolUsuario = 'SUPER_ADMIN' | 'ADMIN_NEGOCIO' | 'MAYORDOMO' | 'OPERARIO' | 'VETERINARIO_EXTERNO';

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
}

export interface Negocio {
  id: string;
  nombre: string;
  rol: RolUsuario;
}

export interface LoginResponse {
  accessToken: string;
  usuario: Usuario;
  negocios: Negocio[];
  negocioActivo: string | null;
}

export interface MeResponse {
  usuario: Usuario;
  negocios: Negocio[];
  negocioActivo: Negocio | null;
  permisos: string[];
}

export interface RegistroPayload {
  nombre: string;
  email: string;
  password: string;
}

export interface Perfil {
  id: string;
  email: string;
  nombre: string;
}

export interface CambiarPasswordPayload {
  passwordActual: string;
  passwordNueva: string;
}

export const authApi = {
  login(email: string, password: string) {
    return http.post<LoginResponse>('/auth/login', { email, password }).then((r) => r.data);
  },
  refresh() {
    return http.post<{ accessToken: string }>('/auth/refresh').then((r) => r.data);
  },
  me() {
    return http.get<MeResponse>('/auth/me').then((r) => r.data);
  },
  logout() {
    return http.post<void>('/auth/logout');
  },
  logoutAll() {
    return http.post<void>('/auth/logout-all');
  },
  switchTenant(negocioId: string) {
    return http.post<{ accessToken: string }>('/auth/switch-tenant', { negocioId }).then((r) => r.data);
  },
  registro(payload: RegistroPayload) {
    return http.post<{ usuarioId: string; email: string }>('/auth/registro', payload).then((r) => r.data);
  },
  recuperarPassword(email: string) {
    return http.post<void>('/auth/recuperar-password', { email });
  },
  resetPassword(token: string, password: string) {
    return http.post<void>('/auth/reset-password', { token, password });
  },
  verificarEmail(token: string) {
    return http.post<void>('/auth/verificar-email', { token });
  },
  reenviarVerificacion(email: string) {
    return http.post<void>('/auth/reenviar-verificacion', { email });
  },
  obtenerPerfil() {
    return http.get<Perfil>('/perfil').then((r) => r.data);
  },
  actualizarPerfil(nombre: string) {
    return http.patch<Perfil>('/perfil', { nombre }).then((r) => r.data);
  },
  cambiarPassword(payload: CambiarPasswordPayload) {
    return http.patch<void>('/perfil/password', payload);
  },
};
