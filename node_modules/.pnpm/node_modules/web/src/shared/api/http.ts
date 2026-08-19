import axios, { type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../../stores/auth.store';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  withCredentials: true,
});

http.interceptors.request.use((config) => {
  const auth = useAuthStore();
  if (auth.accessToken) {
    config.headers.set('Authorization', `Bearer ${auth.accessToken}`);
  }
  return config;
});

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Deduplica refrescos concurrentes: si varias requests reciben 401 al mismo
// tiempo, solo la primera dispara /auth/refresh; el resto espera esa promesa.
let refreshInFlight: Promise<boolean> | null = null;

const NO_REFRESH_PATHS = ['/auth/login', '/auth/refresh', '/auth/registro'];

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';

    if (status !== 401 || !original || original._retry || NO_REFRESH_PATHS.some((p) => url.includes(p))) {
      return Promise.reject(error);
    }

    original._retry = true;
    const auth = useAuthStore();
    refreshInFlight ??= auth.restoreSession().finally(() => {
      refreshInFlight = null;
    });

    const restored = await refreshInFlight;
    if (!restored) {
      auth.clearSession();
      return Promise.reject(error);
    }

    original.headers.set('Authorization', `Bearer ${auth.accessToken}`);
    return http(original);
  },
);
