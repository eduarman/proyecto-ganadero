export interface Paddock {
  name: string;
  animals: number;
  capacity: string;
  pct: string;
  avgDays: string;
  tag: string;
  pillBg: string;
  pillColor: string;
}

export const paddocks: Paddock[] = [
  {
    name: 'Potrero 1',
    animals: 42,
    capacity: '50',
    pct: '84%',
    avgDays: '18 días',
    tag: 'Óptimo',
    pillBg: 'var(--color-neutral-bg)',
    pillColor: 'var(--color-primary)',
  },
  {
    name: 'Potrero 2',
    animals: 38,
    capacity: '45',
    pct: '84%',
    avgDays: '15 días',
    tag: 'Óptimo',
    pillBg: 'var(--color-neutral-bg)',
    pillColor: 'var(--color-primary)',
  },
  {
    name: 'Potrero 3',
    animals: 51,
    capacity: '55',
    pct: '93%',
    avgDays: '12 días',
    tag: 'Al límite',
    pillBg: 'var(--color-warn-bg)',
    pillColor: 'var(--color-warn)',
  },
  {
    name: 'Potrero 4',
    animals: 29,
    capacity: '50',
    pct: '58%',
    avgDays: '22 días',
    tag: 'Disponible',
    pillBg: 'var(--color-neutral-bg)',
    pillColor: 'var(--color-primary)',
  },
];

export interface RotationRow {
  date: string;
  who: string;
  move: string;
  paddock: string;
  pillBg: string;
  pillColor: string;
}

export const history: RotationRow[] = [
  {
    date: '29 jul',
    who: 'Lote 3',
    move: 'Ingreso',
    paddock: 'Potrero 3',
    pillBg: 'var(--color-neutral-bg)',
    pillColor: 'var(--color-primary)',
  },
  {
    date: '27 jul',
    who: 'Esperanza',
    move: 'Salida',
    paddock: 'Potrero 2',
    pillBg: 'var(--color-warn-bg)',
    pillColor: 'var(--color-warn)',
  },
  {
    date: '27 jul',
    who: 'Esperanza',
    move: 'Ingreso',
    paddock: 'Potrero 3',
    pillBg: 'var(--color-neutral-bg)',
    pillColor: 'var(--color-primary)',
  },
  {
    date: '20 jul',
    who: 'Lote 1',
    move: 'Ingreso',
    paddock: 'Potrero 1',
    pillBg: 'var(--color-neutral-bg)',
    pillColor: 'var(--color-primary)',
  },
  {
    date: '14 jul',
    who: 'Perla',
    move: 'Salida',
    paddock: 'Potrero 4',
    pillBg: 'var(--color-warn-bg)',
    pillColor: 'var(--color-warn)',
  },
  {
    date: '02 jul',
    who: 'Lote 2',
    move: 'Ingreso',
    paddock: 'Potrero 2',
    pillBg: 'var(--color-neutral-bg)',
    pillColor: 'var(--color-primary)',
  },
];

export const subjectOptions = ['Lote 3 (Holstein)', 'Esperanza — 004821', 'Luna — 004822'];
export const paddockOptions = ['Potrero 1', 'Potrero 2', 'Potrero 3', 'Potrero 4'];
