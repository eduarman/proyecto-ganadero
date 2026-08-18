export interface Kpi {
  label: string;
  value: string;
  trend: string;
  icon: string;
  bg: string;
  color: string;
  iconBg: string;
  pillBg: string;
  pillColor: string;
}

export const kpis: Kpi[] = [
  {
    label: 'Total de cabezas',
    value: '186',
    trend: '+3',
    icon: 'cow',
    bg: 'var(--color-dark)',
    color: 'var(--color-bg)',
    iconBg: 'rgba(247,247,247,0.12)',
    pillBg: 'var(--color-primary)',
    pillColor: 'var(--color-bg)',
  },
  {
    label: 'Producción de hoy',
    value: '1,842 L',
    trend: '+6.4%',
    icon: 'droplet',
    bg: 'var(--color-primary)',
    color: 'var(--color-bg)',
    iconBg: 'rgba(247,247,247,0.14)',
    pillBg: 'var(--color-dark)',
    pillColor: 'var(--color-bg)',
  },
  {
    label: 'Vacas preñadas',
    value: '24',
    trend: '+5',
    icon: 'heart',
    bg: 'var(--color-white)',
    color: 'var(--color-dark)',
    iconBg: 'var(--color-bg)',
    pillBg: 'var(--color-bg)',
    pillColor: 'var(--color-warn)',
  },
  {
    label: 'Alertas sanitarias',
    value: '5',
    trend: 'Atención',
    icon: 'activity',
    bg: 'var(--color-white)',
    color: 'var(--color-dark)',
    iconBg: 'var(--color-bg)',
    pillBg: 'var(--color-warn-bg)',
    pillColor: 'var(--color-warn)',
  },
];

export interface RankingRow {
  pos: number;
  name: string;
  breed: string;
  paddock: string;
  liters: string;
}

export const ranking: RankingRow[] = [
  { pos: 1, name: 'Canela', breed: 'Holstein', paddock: 'Potrero 3', liters: '30.2 L' },
  { pos: 2, name: 'Esperanza', breed: 'Holstein', paddock: 'Potrero 3', liters: '28.4 L' },
  { pos: 3, name: 'Flor', breed: 'Jersey', paddock: 'Potrero 1', liters: '26.7 L' },
  { pos: 4, name: 'Luna', breed: 'Jersey', paddock: 'Potrero 1', liters: '24.1 L' },
  { pos: 5, name: 'Perla', breed: 'Brahman', paddock: 'Potrero 4', liters: '22.9 L' },
];

export interface WeekBar {
  day: string;
  h: string;
  color: string;
}

export const weekBars: WeekBar[] = [
  { day: 'Lun', h: '58%', color: 'var(--color-accent)' },
  { day: 'Mar', h: '68%', color: 'var(--color-primary)' },
  { day: 'Mié', h: '50%', color: 'var(--color-accent)' },
  { day: 'Jue', h: '82%', color: 'var(--color-primary)' },
  { day: 'Vie', h: '74%', color: 'var(--color-accent)' },
  { day: 'Sáb', h: '64%', color: 'var(--color-primary)' },
  { day: 'Dom', h: '95%', color: 'var(--color-dark)' },
];

export interface AlertRow {
  tag: string;
  pillBg: string;
  pillColor: string;
  title: string;
  detail: string;
}

export const alerts: AlertRow[] = [
  {
    tag: 'Sanidad',
    pillBg: 'var(--color-warn-bg)',
    pillColor: 'var(--color-warn)',
    title: 'Vacuna aftosa — Lote 3',
    detail: 'Vence el 3 de agosto',
  },
  {
    tag: 'Parto',
    pillBg: 'var(--color-neutral-bg)',
    pillColor: 'var(--color-primary)',
    title: 'Parto próximo — Paloma',
    detail: 'Estimado 5 de agosto',
  },
  {
    tag: 'Sanidad',
    pillBg: 'var(--color-warn-bg)',
    pillColor: 'var(--color-warn)',
    title: 'Tratamiento pendiente — Flor',
    detail: 'Mastitis, control en 2 días',
  },
  {
    tag: 'Control',
    pillBg: 'var(--color-neutral-bg)',
    pillColor: 'var(--color-primary)',
    title: 'Control sanitario — Lote 1',
    detail: 'Vence el 8 de agosto',
  },
];

export interface Shortcut {
  label: string;
  icon: string;
}

export const shortcutsDesktop: Shortcut[] = [
  { label: 'Registrar vacunación', icon: 'activity' },
  { label: 'Registrar inseminación', icon: 'heart' },
  { label: 'Registrar producción', icon: 'droplet' },
  { label: 'Registrar alimentación', icon: 'wheat' },
  { label: 'Rotación de potreros', icon: 'map' },
  { label: 'Ver reportes', icon: 'bars' },
];

export const shortcutsMobile: Shortcut[] = [
  { label: 'Vacunar', icon: 'activity' },
  { label: 'Inseminar', icon: 'heart' },
  { label: 'Producción', icon: 'droplet' },
  { label: 'Potreros', icon: 'map' },
];
