export interface CalendarEntry {
  day: string;
  month: string;
  title: string;
  detail: string;
  tag: string;
  pillBg: string;
  pillColor: string;
}

export const calendar: CalendarEntry[] = [
  {
    day: '03',
    month: 'Ago',
    title: 'Aftosa — Lote 3',
    detail: '14 animales pendientes',
    tag: 'Urgente',
    pillBg: 'var(--color-warn-bg)',
    pillColor: 'var(--color-warn)',
  },
  {
    day: '08',
    month: 'Ago',
    title: 'Control sanitario — Lote 1',
    detail: '22 animales',
    tag: 'Próximo',
    pillBg: 'var(--color-neutral-bg)',
    pillColor: 'var(--color-primary)',
  },
  {
    day: '12',
    month: 'Ago',
    title: 'Brucelosis — Lote 2',
    detail: '9 animales',
    tag: 'Próximo',
    pillBg: 'var(--color-neutral-bg)',
    pillColor: 'var(--color-primary)',
  },
  {
    day: '20',
    month: 'Ago',
    title: 'Refuerzo Carbunco',
    detail: 'Todo el hato',
    tag: 'Programado',
    pillBg: 'var(--color-neutral-bg)',
    pillColor: 'var(--color-primary)',
  },
];

export interface HistoryRow {
  date: string;
  cow: string;
  type: string;
  pillBg: string;
  pillColor: string;
  detail: string;
  vet: string;
}

export const history: HistoryRow[] = [
  {
    date: '29 jul',
    cow: 'Flor',
    type: 'Tratamiento',
    pillBg: 'var(--color-warn-bg)',
    pillColor: 'var(--color-warn)',
    detail: 'Mastitis — antibiótico 5 días',
    vet: 'Dr. Salinas',
  },
  {
    date: '22 jul',
    cow: 'Esperanza',
    type: 'Vacunación',
    pillBg: 'var(--color-neutral-bg)',
    pillColor: 'var(--color-primary)',
    detail: 'Aftosa — dosis 2ml',
    vet: 'Dra. Marín',
  },
  {
    date: '18 jul',
    cow: 'Paloma',
    type: 'Control',
    pillBg: 'var(--color-neutral-bg)',
    pillColor: 'var(--color-primary)',
    detail: 'Control sanitario general',
    vet: 'Dr. Salinas',
  },
  {
    date: '10 jul',
    cow: 'Rocío',
    type: 'Vacunación',
    pillBg: 'var(--color-neutral-bg)',
    pillColor: 'var(--color-primary)',
    detail: 'Brucelosis — dosis única',
    vet: 'Dra. Marín',
  },
  {
    date: '02 jul',
    cow: 'Canela',
    type: 'Tratamiento',
    pillBg: 'var(--color-warn-bg)',
    pillColor: 'var(--color-warn)',
    detail: 'Cojera — antiinflamatorio',
    vet: 'Dr. Salinas',
  },
  {
    date: '28 jun',
    cow: 'Perla',
    type: 'Vacunación',
    pillBg: 'var(--color-neutral-bg)',
    pillColor: 'var(--color-primary)',
    detail: 'Carbunco — refuerzo',
    vet: 'Dra. Marín',
  },
];

export const cowOptions = ['Esperanza — 004821', 'Flor — 004826', 'Paloma — 004823', 'Rocío — 004827'];
export const conditionOptions = ['Aftosa', 'Brucelosis', 'Mastitis', 'Carbunco'];
