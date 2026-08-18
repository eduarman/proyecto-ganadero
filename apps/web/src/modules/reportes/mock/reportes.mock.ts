export interface ReportTag {
  label: string;
  bg: string;
  color: string;
}

export const reportTagsDesktop: ReportTag[] = [
  { label: 'Producción mensual', bg: 'var(--color-dark)', color: 'var(--color-bg)' },
  { label: 'Vacunas aplicadas', bg: 'var(--color-neutral-bg)', color: 'var(--color-primary)' },
  { label: 'Próximos partos', bg: 'var(--color-neutral-bg)', color: 'var(--color-primary)' },
  { label: 'Ganancia de peso', bg: 'var(--color-neutral-bg)', color: 'var(--color-primary)' },
  { label: 'Mortalidad', bg: 'var(--color-warn-bg)', color: 'var(--color-warn)' },
  { label: 'Alimentación', bg: 'var(--color-neutral-bg)', color: 'var(--color-primary)' },
  { label: 'Costos', bg: 'var(--color-warn-bg)', color: 'var(--color-warn)' },
  { label: 'Producción por lote', bg: 'var(--color-neutral-bg)', color: 'var(--color-primary)' },
];

export const reportTagsMobile: ReportTag[] = [
  { label: 'Producción', bg: 'var(--color-dark)', color: 'var(--color-bg)' },
  { label: 'Vacunas', bg: 'var(--color-neutral-bg)', color: 'var(--color-primary)' },
  { label: 'Partos', bg: 'var(--color-neutral-bg)', color: 'var(--color-primary)' },
  { label: 'Mortalidad', bg: 'var(--color-warn-bg)', color: 'var(--color-warn)' },
  { label: 'Costos', bg: 'var(--color-warn-bg)', color: 'var(--color-warn)' },
  { label: 'Por lote', bg: 'var(--color-neutral-bg)', color: 'var(--color-primary)' },
];

export interface MonthlyBar {
  month: string;
  h: string;
  color: string;
}

export const production: MonthlyBar[] = [
  { month: 'Feb', h: '55%', color: 'var(--color-accent)' },
  { month: 'Mar', h: '61%', color: 'var(--color-primary)' },
  { month: 'Abr', h: '50%', color: 'var(--color-accent)' },
  { month: 'May', h: '68%', color: 'var(--color-primary)' },
  { month: 'Jun', h: '80%', color: 'var(--color-accent)' },
  { month: 'Jul', h: '95%', color: 'var(--color-dark)' },
];

const PIE_COLORS = ['#dda15e', '#606c38', '#f7f7f7', '#bc6c25'];

export interface CostSlice {
  label: string;
  value: string;
  color: string;
}

export const costs: CostSlice[] = [
  { label: 'Alimentación', value: '$3,180', color: PIE_COLORS[0] },
  { label: 'Personal', value: '$2,450', color: PIE_COLORS[1] },
  { label: 'Sanidad', value: '$1,240', color: PIE_COLORS[2] },
  { label: 'Reproducción', value: '$680', color: PIE_COLORS[3] },
];

const pieValues = [3180, 2450, 1240, 680];

export interface PieSegment {
  color: string;
  dash: string;
  offset: string;
}

export function buildPieSegments(): PieSegment[] {
  const total = pieValues.reduce((s, v) => s + v, 0);
  const circumference = 2 * Math.PI * 15.9;
  let acc = 0;
  return pieValues.map((value, i) => {
    const frac = value / total;
    const dash = `${(frac * circumference).toFixed(2)} ${circumference.toFixed(2)}`;
    const offset = (-acc * circumference).toFixed(2);
    acc += frac;
    return { color: PIE_COLORS[i], dash, offset };
  });
}

const mortality = [3, 2, 4, 1, 2, 1];

export function buildMortalityDots() {
  const w = 320;
  const h = 150;
  const pad = 12;
  const max = 5;
  const step = (w - pad * 2) / (mortality.length - 1);
  return mortality.map((v, i) => ({
    x: (pad + i * step).toFixed(1),
    y: (h - pad - (v / max) * (h - pad * 2)).toFixed(1),
  }));
}

export interface LotRow {
  lot: string;
  animals: number;
  liters: string;
}

export const byLot: LotRow[] = [
  { lot: 'Lote 1', animals: 48, liters: '35,200 L' },
  { lot: 'Lote 2', animals: 44, liters: '29,800 L' },
  { lot: 'Lote 3', animals: 55, liters: '41,600 L' },
  { lot: 'Lote 4', animals: 39, liters: '24,100 L' },
];
