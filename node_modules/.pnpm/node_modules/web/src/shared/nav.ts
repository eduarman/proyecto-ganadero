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
];

// En móvil, "Más" también se considera activo para estos módulos (no tienen
// slot propio en la bottom-nav), igual que en App Web.dc.html.
export const MORE_KEYS = new Set(MORE_NAV.map((i) => i.key).concat('more'));
