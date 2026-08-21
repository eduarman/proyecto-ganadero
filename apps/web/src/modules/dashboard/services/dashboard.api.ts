import { http } from '../../../shared/api/http';

export type Urgencia = 'alta' | 'media';
export type TipoAlerta = 'Sanidad' | 'Diagnóstico' | 'Parto';

export interface Alerta {
  tag: TipoAlerta;
  title: string;
  urgencia: Urgencia;
  linkTo: string;
  fecha: string;
  vencido?: boolean;
}

export interface RankingRow {
  identificador: string;
  raza: string | null;
  potrero: string | null;
  litros: number;
  pos: number;
}

export interface ProduccionDia {
  fecha: string;
  litros: number;
}

export interface OcupacionPotreros {
  normal: number;
  cercaLimite: number;
  sobrecargado: number;
}

export interface ResumenDashboard {
  kpis: {
    totalAnimales: number;
    animalesPorCategoria: Record<string, number>;
    produccionHoy: number;
    vacasPrenadas: number;
    alertasSanitariasActivas: number;
    ocupacionPotreros: OcupacionPotreros;
  };
  alertas: Alerta[];
  ranking: RankingRow[];
  produccionSemana: ProduccionDia[];
}

export const dashboardApi = {
  resumen() {
    return http.get<ResumenDashboard>('/dashboard/resumen').then((r) => r.data);
  },
};
