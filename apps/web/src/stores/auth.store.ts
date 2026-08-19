import { defineStore } from 'pinia';
import { authApi, type Negocio, type Usuario } from '../modules/auth/services/auth.api';

export interface CurrentUser {
  name: string;
  role: string;
  initials: string;
}

const ROL_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN_NEGOCIO: 'Administrador',
  MAYORDOMO: 'Mayordomo',
  OPERARIO: 'Operario',
  VETERINARIO_EXTERNO: 'Veterinario',
};

function initialsOf(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('');
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthenticated: false,
    accessToken: null as string | null,
    usuario: null as Usuario | null,
    negocios: [] as Negocio[],
    negocioActivo: null as Negocio | null,
  }),
  getters: {
    // El access token vive solo en memoria (nunca localStorage) para reducir
    // superficie de robo vía XSS — ver auth-login/design.md.
    user(state): CurrentUser {
      if (!state.usuario) {
        return { name: '', role: '', initials: '' };
      }
      return {
        name: state.usuario.nombre,
        role: state.negocioActivo ? (ROL_LABELS[state.negocioActivo.rol] ?? state.negocioActivo.rol) : '',
        initials: initialsOf(state.usuario.nombre),
      };
    },
  },
  actions: {
    setSession(usuario: Usuario, negocios: Negocio[], negocioActivoId: string | null) {
      this.usuario = usuario;
      this.negocios = negocios;
      this.negocioActivo = negocios.find((n) => n.id === negocioActivoId) ?? negocios[0] ?? null;
      this.isAuthenticated = true;
    },

    clearSession() {
      this.isAuthenticated = false;
      this.accessToken = null;
      this.usuario = null;
      this.negocios = [];
      this.negocioActivo = null;
    },

    async login(email: string, password: string) {
      const { accessToken, usuario, negocios, negocioActivo } = await authApi.login(email, password);
      this.accessToken = accessToken;
      this.setSession(usuario, negocios, negocioActivo);
    },

    // Intenta restaurar la sesión usando el refresh token (cookie httpOnly).
    // Se usa al cargar la app para no perder la sesión en un refresh de página.
    async restoreSession(): Promise<boolean> {
      try {
        const { accessToken } = await authApi.refresh();
        this.accessToken = accessToken;
        const me = await authApi.me();
        this.setSession(me.usuario, me.negocios, me.negocioActivo?.id ?? null);
        return true;
      } catch {
        this.clearSession();
        return false;
      }
    },

    async logout() {
      try {
        await authApi.logout();
      } catch {
        // Best-effort: aunque falle en el backend, limpiamos el estado local.
      }
      this.clearSession();
    },
  },
});
