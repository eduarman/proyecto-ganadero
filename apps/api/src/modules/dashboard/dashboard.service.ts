import { Injectable } from '@nestjs/common';
import { calcularCategoriaEtaria } from '../ganado/categoria-etaria.util';
import { clasificarOcupacion } from '../potreros/ocupacion.util';
import { PotrerosService } from '../potreros/potreros.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProduccionService } from '../produccion/produccion.service';
import { ReproduccionService } from '../reproduccion/reproduccion.service';
import { SanidadService } from '../sanidad/sanidad.service';

const DIAS_VENTANA_SEMANA = 7;
const DIAS_URGENCIA_ALTA = 7;
const MAX_ALERTAS = 30;
const MAX_RANKING = 5;

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

function claveDia(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly produccionService: ProduccionService,
    private readonly potrerosService: PotrerosService,
    private readonly sanidadService: SanidadService,
    private readonly reproduccionService: ReproduccionService,
  ) {}

  private async kpisAnimales(tenantId: string) {
    const animales = await this.prisma.animal.findMany({
      where: { tenantId, estado: 'ACTIVO' },
      select: { fechaNacimiento: true, sexo: true, especie: true },
    });

    const animalesPorCategoria: Record<string, number> = {};
    for (const a of animales) {
      const categoria = calcularCategoriaEtaria(a.fechaNacimiento, a.sexo, a.especie) ?? 'Sin edad registrada';
      animalesPorCategoria[categoria] = (animalesPorCategoria[categoria] ?? 0) + 1;
    }

    return { totalAnimales: animales.length, animalesPorCategoria };
  }

  private async ocupacionPotreros(tenantId: string) {
    const potreros = await this.potrerosService.listar(tenantId);
    return clasificarOcupacion(potreros);
  }

  private async produccionUltimaSemana(tenantId: string) {
    const desde = new Date(Date.now() - DIAS_VENTANA_SEMANA * 24 * 60 * 60 * 1000);
    const [registros, totales] = await Promise.all([
      this.prisma.registroLeche.findMany({
        where: { tenantId, fecha: { gte: desde } },
        include: { animal: { include: { potreroActual: true } } },
      }),
      this.prisma.registroLecheTotal.findMany({ where: { tenantId, fecha: { gte: desde } } }),
    ]);

    const porDia = new Map<string, number>();
    for (const r of registros) {
      const clave = claveDia(r.fecha);
      porDia.set(clave, (porDia.get(clave) ?? 0) + Number(r.litros));
    }
    for (const t of totales) {
      const clave = claveDia(t.fecha);
      porDia.set(clave, (porDia.get(clave) ?? 0) + Number(t.litrosTotal));
    }
    const produccionSemana = Array.from({ length: DIAS_VENTANA_SEMANA }, (_, i) => {
      const fecha = new Date(Date.now() - (DIAS_VENTANA_SEMANA - 1 - i) * 24 * 60 * 60 * 1000);
      const clave = claveDia(fecha);
      return { fecha: clave, litros: porDia.get(clave) ?? 0 };
    });

    const porAnimal = new Map<string, { identificador: string; raza: string | null; potrero: string | null; litros: number }>();
    for (const r of registros) {
      const acumulado = porAnimal.get(r.animalId);
      const litros = Number(r.litros);
      if (acumulado) {
        acumulado.litros += litros;
      } else {
        porAnimal.set(r.animalId, {
          identificador: r.animal.identificador,
          raza: r.animal.raza,
          potrero: r.animal.potreroActual?.nombre ?? null,
          litros,
        });
      }
    }
    const ranking = Array.from(porAnimal.values())
      .sort((a, b) => b.litros - a.litros)
      .slice(0, MAX_RANKING)
      .map((r, i) => ({ ...r, pos: i + 1 }));

    return { produccionSemana, ranking };
  }

  private async alertasConsolidadas(tenantId: string): Promise<{ items: Alerta[]; alertasSanitariasActivas: number }> {
    const [sanitarias, pendientesDiagnostico, partosProximos] = await Promise.all([
      this.sanidadService.alertas(tenantId),
      this.reproduccionService.pendientesDiagnostico(tenantId),
      this.reproduccionService.calendario(tenantId),
    ]);

    const alertas: Alerta[] = [];

    for (const a of sanitarias) {
      if (!a.proximaFechaEsperada) continue;
      alertas.push({
        tag: 'Sanidad',
        title: `${a.producto.nombre} — ${a.animal.identificador}`,
        urgencia: a.vencido ? 'alta' : 'media',
        linkTo: '/sanidad',
        fecha: a.proximaFechaEsperada.toISOString(),
        vencido: a.vencido,
      });
    }

    for (const s of pendientesDiagnostico) {
      alertas.push({
        tag: 'Diagnóstico',
        title: `Diagnóstico pendiente — ${s.animal.identificador}`,
        urgencia: s.fechaEstimadaDiagnostico <= new Date(Date.now() + DIAS_URGENCIA_ALTA * 24 * 60 * 60 * 1000) ? 'alta' : 'media',
        linkTo: '/reproduccion',
        fecha: s.fechaEstimadaDiagnostico.toISOString(),
      });
    }

    for (const s of partosProximos) {
      alertas.push({
        tag: 'Parto',
        title: `Parto próximo — ${s.animal.identificador}`,
        urgencia: s.fechaProbableParto <= new Date(Date.now() + DIAS_URGENCIA_ALTA * 24 * 60 * 60 * 1000) ? 'alta' : 'media',
        linkTo: '/reproduccion',
        fecha: s.fechaProbableParto.toISOString(),
      });
    }

    const items = alertas
      .sort((a, b) => {
        if (a.urgencia !== b.urgencia) return a.urgencia === 'alta' ? -1 : 1;
        return a.fecha.localeCompare(b.fecha);
      })
      .slice(0, MAX_ALERTAS);

    return { items, alertasSanitariasActivas: sanitarias.length };
  }

  async obtenerResumen(tenantId: string) {
    const [kpisAnimales, ocupacionPotreros, indicadoresProduccion, vacasPrenadas, { produccionSemana, ranking }, alertas] =
      await Promise.all([
        this.kpisAnimales(tenantId),
        this.ocupacionPotreros(tenantId),
        this.produccionService.indicadores(tenantId),
        this.reproduccionService.contarPrenadas(tenantId),
        this.produccionUltimaSemana(tenantId),
        this.alertasConsolidadas(tenantId),
      ]);

    return {
      kpis: {
        totalAnimales: kpisAnimales.totalAnimales,
        animalesPorCategoria: kpisAnimales.animalesPorCategoria,
        produccionHoy: indicadoresProduccion.totalHoy,
        vacasPrenadas,
        alertasSanitariasActivas: alertas.alertasSanitariasActivas,
        ocupacionPotreros,
      },
      alertas: alertas.items,
      ranking,
      produccionSemana,
    };
  }
}
