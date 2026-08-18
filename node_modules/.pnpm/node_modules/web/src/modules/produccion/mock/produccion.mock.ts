export interface ProduccionKpi {
  label: string;
  value: string;
  hint: string;
  bg: string;
  color: string;
}

export const kpis: ProduccionKpi[] = [
  {
    label: 'Producción de hoy',
    value: '1,842 L',
    hint: 'Turno mañana + tarde',
    bg: 'var(--color-dark)',
    color: 'var(--color-bg)',
  },
  {
    label: 'Promedio por vaca',
    value: '24.7 L',
    hint: '186 animales en ordeño',
    bg: 'var(--color-primary)',
    color: 'var(--color-bg)',
  },
  {
    label: 'Variación mensual',
    value: '+6.4%',
    hint: 'Vs. mes anterior',
    bg: 'var(--color-white)',
    color: 'var(--color-dark)',
  },
];

export interface MonthlyBar {
  month: string;
  value: string;
  h: string;
  color: string;
}

export const monthly: MonthlyBar[] = [
  { month: 'Feb', value: '51.2k', h: '55%', color: 'var(--color-accent)' },
  { month: 'Mar', value: '53.8k', h: '61%', color: 'var(--color-primary)' },
  { month: 'Abr', value: '49.1k', h: '50%', color: 'var(--color-accent)' },
  { month: 'May', value: '55.6k', h: '68%', color: 'var(--color-primary)' },
  { month: 'Jun', value: '58.3k', h: '80%', color: 'var(--color-accent)' },
  { month: 'Jul', value: '61.9k', h: '95%', color: 'var(--color-dark)' },
];

export interface DailyRow {
  date: string;
  cow: string;
  shift: string;
  liters: string;
}

export const daily: DailyRow[] = [
  { date: '29 jul', cow: 'Canela', shift: 'Mañana', liters: '15.4 L' },
  { date: '29 jul', cow: 'Canela', shift: 'Tarde', liters: '14.8 L' },
  { date: '29 jul', cow: 'Esperanza', shift: 'Mañana', liters: '14.6 L' },
  { date: '29 jul', cow: 'Esperanza', shift: 'Tarde', liters: '13.8 L' },
  { date: '29 jul', cow: 'Flor', shift: 'Mañana', liters: '13.9 L' },
  { date: '29 jul', cow: 'Luna', shift: 'Tarde', liters: '12.1 L' },
];

export const cowOptions = ['Canela — 004824', 'Esperanza — 004821', 'Flor — 004826', 'Luna — 004822'];
export const shiftOptions = ['Mañana', 'Tarde'];
