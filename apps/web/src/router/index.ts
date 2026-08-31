import { createRouter, createWebHistory } from 'vue-router';
import ResponsiveShell from '../shared/components/ResponsiveShell.vue';
import { NAV_KEYS_VETERINARIO } from '../shared/nav';
import { useAuthStore } from '../stores/auth.store';

declare module 'vue-router' {
  interface RouteMeta {
    title?: string;
    subtitle?: string;
    navKey?: string;
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/dashboard' },
    {
      path: '/login',
      name: 'login',
      component: () => import('../modules/auth/views/LoginView.vue'),
    },
    {
      path: '/registro',
      name: 'registro',
      component: () => import('../modules/auth/views/RegistroView.vue'),
    },
    {
      path: '/recuperar-password',
      name: 'recuperar-password',
      component: () => import('../modules/auth/views/RecuperarPasswordView.vue'),
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('../modules/auth/views/ResetPasswordView.vue'),
    },
    {
      path: '/verificar-email',
      name: 'verificar-email',
      component: () => import('../modules/auth/views/VerificarEmailView.vue'),
    },
    {
      path: '/invitaciones/:token',
      name: 'aceptar-invitacion',
      component: () => import('../modules/usuarios/views/AceptarInvitacionView.vue'),
    },
    {
      path: '/',
      component: ResponsiveShell,
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('../modules/dashboard/views/DashboardView.vue'),
          meta: {
            navKey: 'dashboard',
            title: 'Panel general',
            subtitle: 'Resumen operativo del hato en tiempo real',
          },
        },
        {
          path: 'ganado',
          name: 'ganado',
          component: () => import('../modules/ganado/views/GanadoView.vue'),
          meta: {
            navKey: 'ganado',
            title: 'Gestión del ganado',
            subtitle: 'Fichas, registro y genealogía del hato',
          },
        },
        {
          path: 'sanidad',
          name: 'sanidad',
          component: () => import('../modules/sanidad/views/SanidadView.vue'),
          meta: {
            navKey: 'sanidad',
            title: 'Sanidad',
            subtitle: 'Vacunación, tratamientos y calendario sanitario',
          },
        },
        {
          path: 'reproduccion',
          name: 'reproduccion',
          component: () => import('../modules/reproduccion/views/ReproduccionView.vue'),
          meta: {
            navKey: 'reproduccion',
            title: 'Reproducción',
            subtitle: 'Servicios, palpaciones y partos próximos',
          },
        },
        {
          path: 'produccion',
          name: 'produccion',
          component: () => import('../modules/produccion/views/ProduccionView.vue'),
          meta: {
            navKey: 'produccion',
            title: 'Producción de leche',
            subtitle: 'Registro y análisis de producción diaria',
          },
        },
        {
          path: 'alimentacion',
          name: 'alimentacion',
          component: () => import('../modules/alimentacion/views/AlimentacionView.vue'),
          meta: {
            navKey: 'alimentacion',
            title: 'Alimentación',
            subtitle: 'Registro de dietas, suplementos y costos',
          },
        },
        {
          path: 'potreros',
          name: 'potreros',
          component: () => import('../modules/potreros/views/PotrerosView.vue'),
          meta: {
            navKey: 'potreros',
            title: 'Potreros',
            subtitle: 'Rotación, ocupación y permanencia',
          },
        },
        {
          path: 'reportes',
          name: 'reportes',
          component: () => import('../modules/reportes/views/ReportesView.vue'),
          meta: {
            navKey: 'reportes',
            title: 'Reportes',
            subtitle: 'Indicadores del hato para la toma de decisiones',
          },
        },
        {
          path: 'trabajadores',
          name: 'trabajadores',
          component: () => import('../modules/trabajadores/views/ListaTrabajadoresView.vue'),
          meta: {
            navKey: 'trabajadores',
            title: 'Trabajadores',
            subtitle: 'Personal de campo, cargos y ficha de cada trabajador',
          },
        },
        {
          path: 'trabajadores/asistencia',
          name: 'trabajadores-asistencia',
          component: () => import('../modules/trabajadores/views/AsistenciaView.vue'),
          meta: {
            navKey: 'trabajadores',
            title: 'Asistencia del día',
            subtitle: 'Registro diario de asistencia de la cuadrilla',
          },
        },
        {
          path: 'trabajadores/reportes',
          name: 'trabajadores-reportes',
          component: () => import('../modules/trabajadores/views/ReportesTrabajadoresView.vue'),
          meta: {
            navKey: 'trabajadores',
            title: 'Reportes de trabajadores',
            subtitle: 'Trabajadores, asistencia, pagos y costo laboral',
          },
        },
        {
          path: 'trabajadores/:id',
          name: 'trabajador-ficha',
          component: () => import('../modules/trabajadores/views/FichaTrabajadorView.vue'),
          meta: {
            navKey: 'trabajadores',
            title: 'Trabajador',
            subtitle: 'Ficha del trabajador',
          },
        },
        {
          path: 'usuarios',
          name: 'usuarios',
          component: () => import('../modules/usuarios/views/ListaUsuariosView.vue'),
          meta: {
            navKey: 'usuarios',
            title: 'Usuarios',
            subtitle: 'Equipo del negocio y roles',
          },
        },
        {
          path: 'cuenta',
          name: 'cuenta',
          component: () => import('../modules/cuenta/views/CuentaView.vue'),
          meta: {
            navKey: 'cuenta',
            title: 'Cuenta',
            subtitle: 'Datos personales, seguridad y preferencias',
          },
        },
        {
          path: 'mas',
          name: 'mas',
          component: () => import('../modules/dashboard/views/MoreView.vue'),
          meta: {
            navKey: 'more',
            title: 'Más módulos',
            subtitle: 'Todo el sistema',
          },
        },
      ],
    },
  ],
});

// El access token vive solo en memoria: al recargar la página se pierde, así
// que la primera navegación intenta restaurar la sesión vía refresh cookie
// antes de decidir si redirige a /login.
let sessionRestoreAttempted = false;

// Rutas de auth accesibles solo si NO hay sesión activa (design.md) — si ya
// hay sesión, se redirige a /dashboard en vez de mostrarlas.
const PUBLIC_AUTH_ROUTES = new Set([
  'login',
  'registro',
  'recuperar-password',
  'reset-password',
  'verificar-email',
]);

// Accesible siempre, con o sin sesión activa: quien acepta una invitación
// puede ya estar logueado (usuario existente, US-2.3) — a diferencia de
// PUBLIC_AUTH_ROUTES, acá no corresponde redirigir a /dashboard.
const ALWAYS_PUBLIC_ROUTES = new Set(['aceptar-invitacion']);

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  if (!sessionRestoreAttempted) {
    sessionRestoreAttempted = true;
    await auth.restoreSession();
  }

  if (typeof to.name === 'string' && ALWAYS_PUBLIC_ROUTES.has(to.name)) {
    return true;
  }

  const isPublicAuthRoute = typeof to.name === 'string' && PUBLIC_AUTH_ROUTES.has(to.name);

  if (!isPublicAuthRoute && !auth.isAuthenticated) {
    return { name: 'login' };
  }

  if (isPublicAuthRoute && auth.isAuthenticated) {
    return { path: '/dashboard' };
  }

  if (
    auth.isAuthenticated &&
    auth.rolActivo === 'VETERINARIO_EXTERNO' &&
    typeof to.meta.navKey === 'string' &&
    !NAV_KEYS_VETERINARIO.has(to.meta.navKey)
  ) {
    return { path: '/sanidad' };
  }

  return true;
});

export default router;
