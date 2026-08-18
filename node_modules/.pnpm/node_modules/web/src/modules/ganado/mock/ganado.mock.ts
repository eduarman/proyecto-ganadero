export interface HistoryEntry {
  date: string;
  event: string;
  detail: string;
}

export interface Cow {
  id: number;
  name: string;
  rfid: string;
  breed: string;
  birth: string;
  paddock: string;
  status: string;
  pillBg: string;
  pillColor: string;
  avgLiters: string;
  father: string;
  mother: string;
  history: HistoryEntry[];
}

const ACTIVE = { pillBg: 'var(--color-neutral-bg)', pillColor: 'var(--color-primary)' };
const ATTENTION = { pillBg: 'var(--color-warn-bg)', pillColor: 'var(--color-warn)' };

export const cows: Cow[] = [
  {
    id: 1,
    name: 'Esperanza',
    rfid: '004821',
    breed: 'Holstein',
    birth: '14/03/2021',
    paddock: 'Potrero 3',
    status: 'Activa',
    ...ACTIVE,
    avgLiters: '28.4 L/día',
    father: 'Toro Max',
    mother: 'Alba',
    history: [
      { date: '28 jul', event: 'Producción', detail: '28.4 L — Turno mañana' },
      { date: '22 jul', event: 'Vacunación', detail: 'Aftosa — dosis 2ml' },
      { date: '10 jul', event: 'Alimentación', detail: 'Ensilaje + concentrado 4kg' },
      { date: '02 jun', event: 'Palpación', detail: 'Negativa' },
    ],
  },
  {
    id: 2,
    name: 'Luna',
    rfid: '004822',
    breed: 'Jersey',
    birth: '02/11/2020',
    paddock: 'Potrero 1',
    status: 'Activa',
    ...ACTIVE,
    avgLiters: '24.1 L/día',
    father: 'Rayo',
    mother: 'Nube',
    history: [
      { date: '27 jul', event: 'Producción', detail: '24.1 L — Turno tarde' },
      { date: '15 jul', event: 'Rotación', detail: 'Ingreso a Potrero 1' },
    ],
  },
  {
    id: 3,
    name: 'Paloma',
    rfid: '004823',
    breed: 'Brahman',
    birth: '20/08/2019',
    paddock: 'Potrero 2',
    status: 'Preñada',
    ...ATTENTION,
    avgLiters: '19.6 L/día',
    father: 'Cacique',
    mother: 'Reina',
    history: [
      { date: '20 jul', event: 'Palpación', detail: 'Positiva — 6 meses' },
      { date: '05 mar', event: 'Inseminación', detail: 'Artificial — Toro Cacique' },
    ],
  },
  {
    id: 4,
    name: 'Canela',
    rfid: '004824',
    breed: 'Holstein',
    birth: '09/01/2022',
    paddock: 'Potrero 3',
    status: 'Activa',
    ...ACTIVE,
    avgLiters: '30.2 L/día',
    father: 'Toro Max',
    mother: 'Dulce',
    history: [{ date: '28 jul', event: 'Producción', detail: '30.2 L — Turno mañana' }],
  },
  {
    id: 5,
    name: 'Estrella',
    rfid: '004825',
    breed: 'Angus',
    birth: '30/06/2021',
    paddock: 'Potrero 4',
    status: 'Activa',
    ...ACTIVE,
    avgLiters: '21.0 L/día',
    father: 'Titán',
    mother: 'Gema',
    history: [{ date: '26 jul', event: 'Alimentación', detail: 'Pastura + sal mineral' }],
  },
  {
    id: 6,
    name: 'Flor',
    rfid: '004826',
    breed: 'Jersey',
    birth: '15/05/2020',
    paddock: 'Potrero 1',
    status: 'Tratamiento',
    ...ATTENTION,
    avgLiters: '26.7 L/día',
    father: 'Rayo',
    mother: 'Violeta',
    history: [{ date: '29 jul', event: 'Tratamiento', detail: 'Mastitis — Antibiótico' }],
  },
  {
    id: 7,
    name: 'Rocío',
    rfid: '004827',
    breed: 'Holstein',
    birth: '01/12/2019',
    paddock: 'Potrero 2',
    status: 'Activa',
    ...ACTIVE,
    avgLiters: '18.3 L/día',
    father: 'Toro Max',
    mother: 'Aurora',
    history: [{ date: '24 jul', event: 'Producción', detail: '18.3 L — Turno tarde' }],
  },
  {
    id: 8,
    name: 'Perla',
    rfid: '004828',
    breed: 'Brahman',
    birth: '22/04/2022',
    paddock: 'Potrero 4',
    status: 'Preñada',
    ...ATTENTION,
    avgLiters: '22.9 L/día',
    father: 'Cacique',
    mother: 'Marfil',
    history: [{ date: '18 jul', event: 'Palpación', detail: 'Positiva — 3 meses' }],
  },
];

export const breeds = ['Holstein', 'Jersey', 'Brahman', 'Angus'];
