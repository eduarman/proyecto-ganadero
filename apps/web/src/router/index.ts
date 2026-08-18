import { createRouter, createWebHistory } from 'vue-router';
import ResponsiveShell from '../shared/components/ResponsiveShell.vue';

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

export default router;
