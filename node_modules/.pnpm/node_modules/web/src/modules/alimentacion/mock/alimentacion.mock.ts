export interface AlimentacionKpi {
  label: string;
  value: string;
  hint: string;
  bg: string;
  color: string;
}

export const kpis: AlimentacionKpi[] = [
  {
    label: 'Consumo diario',
    value: '842 kg',
    hint: 'Todo el hato',
    bg: 'var(--color-dark)',
    color: 'var(--color-bg)',
  },
  {
    label: 'Consumo promedio',
    value: '4.5 kg',
    hint: 'Por animal / día',
    bg: 'var(--color-primary)',
    color: 'var(--color-bg)',
  },
  {
    label: 'Costo mensual',
    value: '$3,180',
    hint: 'Alimento + suplementos',
    bg: 'var(--color-white)',
    color: 'var(--color-dark)',
  },
];

export interface CostRow {
  label: string;
  value: string;
  pct: string;
  color: string;
}

export const costs: CostRow[] = [
  { label: 'Ensilaje de maíz', value: '$1,420', pct: '82%', color: 'var(--color-dark)' },
  { label: 'Concentrado 18%', value: '$980', pct: '58%', color: 'var(--color-primary)' },
  { label: 'Pastura', value: '$540', pct: '32%', color: 'var(--color-accent)' },
  { label: 'Sal mineral', value: '$240', pct: '14%', color: 'var(--color-warn)' },
];

export interface ConsumptionRow {
  date: string;
  cow: string;
  feed: string;
  kg: string;
  cost: string;
}

export const consumption: ConsumptionRow[] = [
  { date: '29 jul', cow: 'Esperanza', feed: 'Ensilaje + concentrado', kg: '5.2 kg', cost: '$4.10' },
  { date: '29 jul', cow: 'Canela', feed: 'Ensilaje + concentrado', kg: '5.6 kg', cost: '$4.35' },
  { date: '29 jul', cow: 'Flor', feed: 'Pastura + sal mineral', kg: '4.1 kg', cost: '$2.80' },
  { date: '28 jul', cow: 'Luna', feed: 'Concentrado 18%', kg: '3.8 kg', cost: '$3.20' },
  { date: '28 jul', cow: 'Paloma', feed: 'Ensilaje de maíz', kg: '4.9 kg', cost: '$3.60' },
  { date: '28 jul', cow: 'Estrella', feed: 'Pastura', kg: '4.0 kg', cost: '$2.10' },
];

export const cowOptions = ['Lote 1 (completo)', 'Esperanza — 004821', 'Flor — 004826'];
export const feedOptions = ['Ensilaje de maíz', 'Concentrado 18%', 'Pastura', 'Sal mineral'];
