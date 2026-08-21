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
  switchTenant(negocioId: string) {
    return http.post<{ accessToken: string }>('/auth/switch-tenant', { negocioId }).then((r) => r.data);
  },
};
