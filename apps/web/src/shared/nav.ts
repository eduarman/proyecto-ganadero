export interface NavItem {
  key: string;
  label: string;
  icon: string;
  path: string;
  desc?: string;
}

// Ítems del sidebar de escritorio (AppLayout), de Sistema Ganadero.dc.html.
export const SIDEBAR_NAV: NavItem[] = [
  { key: 'dashboard', label: 'Panel general', icon: 'home', path: '/dashboard' },
  { key: 'ganado', label: 'Gestión del ganado', icon: 'cow', path: '/ganado' },
  { key: 'sanidad', label: 'Sanidad', icon: 'activity', path: '/sanidad' },
  { key: 'reproduccion', label: 'Reproducción', icon: 'heart', path: '/reproduccion' },
  { key: 'produccion', label: 'Producción', icon: 'droplet', path: '/produccion' },
  { key: 'alimentacion', label: 'Alimentación', icon: 'wheat', path: '/alimentacion' },
  { key: 'potreros', label: 'Potreros', icon: 'map', path: '/potreros' },
  { key: 'reportes', label: 'Reportes', icon: 'bars', path: '/reportes' },
  { key: 'usuarios', label: 'Usuarios', icon: 'users', path: '/usuarios' },
  { key: 'cuenta', label: 'Cuenta', icon: 'account', path: '/cuenta' },
];

// Bottom-nav móvil (5 slots), de App Web.dc.html — los módulos que no caben
// viven detrás de "Más" (MORE_NAV).
export const BOTTOM_NAV: NavItem[] = [
  { key: 'dashboard', label: 'Inicio', icon: 'home', path: '/dashboard' },
  { key: 'ganado', label: 'Ganado', icon: 'cow', path: '/ganado' },
  { key: 'sanidad', label: 'Sanidad', icon: 'activity', path: '/sanidad' },
  { key: 'produccion', label: 'Prod.', icon: 'droplet', path: '/produccion' },
  { key: 'more', label: 'Más', icon: 'more', path: '/mas' },
];

// Módulos que en móvil se acceden desde la pantalla "Más" (MobileMore.dc.html).
export const MORE_NAV: NavItem[] = [
  {
    key: 'reproduccion',
    label: 'Reproducción',
    desc: 'Servicios y partos próximos',
    icon: 'heart',
    path: '/reproduccion',
  },
  {
    key: 'alimentacion',
    label: 'Alimentación',
    desc: 'Dietas, suplementos y costos',
    icon: 'wheat',
    path: '/alimentacion',
  },
  { key: 'potreros', label: 'Potreros', desc: 'Rotación y ocupación', icon: 'map', path: '/potreros' },
  { key: 'reportes', label: 'Reportes', desc: 'Indicadores del hato', icon: 'bars', path: '/reportes' },
  { key: 'usuarios', label: 'Usuarios', desc: 'Equipo del negocio y roles', icon: 'users', path: '/usuarios' },
];

// En móvil, "Más" también se considera activo para estos módulos (no tienen
// slot propio en la bottom-nav), igual que en App Web.dc.html.
export const MORE_KEYS = new Set(MORE_NAV.map((i) => i.key).concat('more'));

// VETERINARIO_EXTERNO solo tiene Sanidad (RW), Ganado (solo lectura) y Cuenta
// — el resto del shell no se le muestra ni se le permite navegar (guard en
// router/index.ts). Ver .claude/steering/security-roles.md.
export const NAV_KEYS_VETERINARIO = new Set(['sanidad', 'ganado', 'cuenta']);

// "Usuarios" solo lo ve/administra ADMIN_NEGOCIO (matriz de permisos) — el
// backend ya es la barrera real (@Roles(ADMIN_NEGOCIO) en usuarios.controller);
// esto es solo para no mostrar la entrada de nav a quien no puede usarla.
export const NAV_KEYS_ADMIN = new Set(['usuarios']);

// OPERARIO no tiene acceso a Reportes (security-roles.md); el backend ya lo
// bloquea (403) — esto evita mandarlo a una ruta que igual le va a fallar.
export const NAV_KEYS_SIN_OPERARIO = new Set(['reportes']);
