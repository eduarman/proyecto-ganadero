export interface BirthEntry {
  day: string;
  month: string;
  cow: string;
  detail: string;
  tag: string;
  pillBg: string;
  pillColor: string;
}

export const births: BirthEntry[] = [
  {
    day: '05',
    month: 'Ago',
    cow: 'Paloma',
    detail: 'Servicio: Insem. artificial',
    tag: 'Esta semana',
    pillBg: 'var(--color-warn-bg)',
    pillColor: 'var(--color-warn)',
  },
  {
    day: '14',
    month: 'Ago',
    cow: 'Perla',
    detail: 'Servicio: Insem. artificial',
    tag: 'Próximo',
    pillBg: 'var(--color-neutral-bg)',
    pillColor: 'var(--color-primary)',
  },
  {
    day: '02',
    month: 'Sep',
    cow: 'Estrella',
    detail: 'Servicio natural',
    tag: 'Programado',
    pillBg: 'var(--color-neutral-bg)',
    pillColor: 'var(--color-primary)',
  },
  {
    day: '19',
    month: 'Sep',
    cow: 'Luna',
    detail: 'Servicio natural',
    tag: 'Programado',
    pillBg: 'var(--color-neutral-bg)',
    pillColor: 'var(--color-primary)',
  },
];

export interface PregnantRow {
  cow: string;
  service: string;
  serviceDate: string;
  dueDate: string;
  status: string;
  pillBg: string;
  pillColor: string;
}

export const pregnant: PregnantRow[] = [
  {
    cow: 'Paloma',
    service: 'Inseminación artificial',
    serviceDate: '05 mar',
    dueDate: '05 ago',
    status: 'Confirmada',
    pillBg: 'var(--color-warn-bg)',
    pillColor: 'var(--color-warn)',
  },
  {
    cow: 'Perla',
    service: 'Inseminación artificial',
    serviceDate: '14 mar',
    dueDate: '14 ago',
    status: 'Confirmada',
    pillBg: 'var(--color-warn-bg)',
    pillColor: 'var(--color-warn)',
  },
  {
    cow: 'Estrella',
    service: 'Servicio natural',
    serviceDate: '02 dic',
    dueDate: '02 sep',
    status: 'Confirmada',
    pillBg: 'var(--color-warn-bg)',
    pillColor: 'var(--color-warn)',
  },
  {
    cow: 'Luna',
    service: 'Servicio natural',
    serviceDate: '19 dic',
    dueDate: '19 sep',
    status: 'Por confirmar',
    pillBg: 'var(--color-neutral-bg)',
    pillColor: 'var(--color-primary)',
  },
  {
    cow: 'Rocío',
    service: 'Inseminación artificial',
    serviceDate: '30 ene',
    dueDate: '30 oct',
    status: 'Confirmada',
    pillBg: 'var(--color-warn-bg)',
    pillColor: 'var(--color-warn)',
  },
];

export const cowOptions = ['Paloma — 004823', 'Perla — 004828', 'Luna — 004822', 'Estrella — 004825'];
export const resultOptions = ['Pendiente', 'Positiva', 'Negativa'];
