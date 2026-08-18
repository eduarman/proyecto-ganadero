import { defineStore } from 'pinia';

export interface CurrentUser {
  name: string;
  role: string;
  initials: string;
}

// Placeholder hasta la fase de backend real (.claude/specs/auth-login):
// no hay JWT ni sesión persistida todavía, solo un usuario fijo para poder
// construir el resto de las pantallas con datos consistentes.
export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthenticated: false,
    user: {
      name: 'Marcos Idrovo',
      role: 'Administrador',
      initials: 'MI',
    } as CurrentUser,
  }),
  actions: {
    login() {
      this.isAuthenticated = true;
    },
    logout() {
      this.isAuthenticated = false;
    },
  },
});
