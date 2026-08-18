import axios from 'axios';

// Instancia central de Axios. Sin backend todavía (fase actual usa datos mock
// por módulo) — punto de extensión listo para cuando exista apps/api.
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  withCredentials: true,
});
