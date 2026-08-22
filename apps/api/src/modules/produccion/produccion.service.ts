import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearRegistroLecheDto } from './dto/crear-registro-leche.dto';
import { CrearRegistroPesoLoteDto } from './dto/crear-registro-peso-lote.dto';
import { CrearRegistroPesoDto } from './dto/crear-registro-peso.dto';
import { CrearRegistroTotalDto } from './dto/crear-registro-total.dto';

const MESES_INDICADORES = 6;

function inicioDeMesUTC(base: Date, offsetMeses: number): Date {
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + offsetMeses, 1));
}

function claveMs(fecha: Date): string {
  return `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, '0')}`;
}

@Injectable()
export class ProduccionService {
  constructor(private readonly prisma: PrismaService) {}

  async registrarLeche(tenantId: string, dto: CrearRegistroLecheDto, registradoPor: string) {
    const animal = await this.prisma.animal.findFirst({
      where: { id: dto.animalId, tenantId },
    });
    if (!animal) {
      throw new NotFoundException('Animal no encontrado.');
    }

    const fecha = new Date(dto.fecha);

    // upsert: permite corregir un valor cargado por error el mismo día/turno
    // sin generar un registro duplicado (US-2, design.md).
    return this.prisma.registroLeche.upsert({
      where: {
        tenantId_animalId_fecha_turno: { tenantId, animalId: dto.animalId, fecha, turno: dto.turno },
      },
      create: {
        tenantId,
        animalId: dto.animalId,
        fecha,
        turno: dto.turno,
        litros: dto.litros,
        registradoPor,
      },
      update: { litros: dto.litros, registradoPor },
      include: { animal: true },
    });
  }

  listar(tenantId: string, animalId?: string) {
    return this.prisma.registroLeche.findMany({
      where: { tenantId, ...(animalId && { animalId }) },
      include: { animal: true },
      orderBy: { fecha: 'desc' },
      take: 50,
    });
  }

  async registrarTotal(tenantId: string, dto: CrearRegistroTotalDto, registradoPor: string) {
    const fecha = new Date(dto.fecha);

    return this.prisma.registroLecheTotal.upsert({
      where: { tenantId_fecha_turno: { tenantId, fecha, turno: dto.turno } },
      create: { tenantId, fecha, turno: dto.turno, litrosTotal: dto.litrosTotal, registradoPor },
      update: { litrosTotal: dto.litrosTotal, registradoPor },
    });
  }

  listarTotales(tenantId: string) {
    return this.prisma.registroLecheTotal.findMany({
      where: { tenantId },
      orderBy: { fecha: 'desc' },
      take: 50,
    });
  }

  async registrarPeso(tenantId: string, dto: CrearRegistroPesoDto, registradoPor: string) {
    const animal = await this.prisma.animal.findFirst({
      where: { id: dto.animalId, tenantId },
    });
    if (!animal) {
      throw new NotFoundException('Animal no encontrado.');
    }

    const fecha = new Date(dto.fecha);

    // upsert: mismo patrón que registrarLeche — permite corregir un pesaje
    // cargado por error el mismo día sin generar un registro duplicado.
    return this.prisma.registroPeso.upsert({
      where: { tenantId_animalId_fecha: { tenantId, animalId: dto.animalId, fecha } },
      create: { tenantId, animalId: dto.animalId, fecha, pesoKg: dto.pesoKg, registradoPor },
      update: { pesoKg: dto.pesoKg, registradoPor },
      include: { animal: true },
    });
  }

  async registrarPesoLote(tenantId: string, dto: CrearRegistroPesoLoteDto, registradoPor: string) {
    const animalIdsUnicos = Array.from(new Set(dto.registros.map((r) => r.animalId)));
    const animales = await this.prisma.animal.findMany({
      where: { id: { in: animalIdsUnicos }, tenantId },
    });
    if (animales.length !== animalIdsUnicos.length) {
      throw new NotFoundException('Uno o más animales no existen en este negocio.');
    }

    const fecha = new Date(dto.fecha);
    return this.prisma.$transaction(
      dto.registros.map((r) =>
        this.prisma.registroPeso.upsert({
          where: { tenantId_animalId_fecha: { tenantId, animalId: r.animalId, fecha } },
          create: { tenantId, animalId: r.animalId, fecha, pesoKg: r.pesoKg, registradoPor },
          update: { pesoKg: r.pesoKg, registradoPor },
        }),
      ),
    );
  }

  listarPesos(tenantId: string, animalId?: string) {
    return this.prisma.registroPeso.findMany({
      where: { tenantId, ...(animalId && { animalId }) },
      include: { animal: true },
      orderBy: { fecha: 'desc' },
      take: 50,
    });
  }

  async gdp(tenantId: string, animalId: string) {
    const animal = await this.prisma.animal.findFirst({ where: { id: animalId, tenantId } });
    if (!animal) {
      throw new NotFoundException('Animal no encontrado.');
    }

    const pesajes = await this.prisma.registroPeso.findMany({
      where: { tenantId, animalId },
      orderBy: { fecha: 'asc' },
    });

    let anterior: (typeof pesajes)[number] | null = null;
    return pesajes.map((p) => {
      let gdpKgDia: number | null = null;
      if (anterior) {
        const dias = Math.round((p.fecha.getTime() - anterior.fecha.getTime()) / (24 * 60 * 60 * 1000));
        // El UNIQUE (tenantId, animalId, fecha) hace estructuralmente imposible
        // dias === 0, pero se guarda igual contra división por cero.
        if (dias > 0) {
          gdpKgDia = (Number(p.pesoKg) - Number(anterior.pesoKg)) / dias;
        }
      }
      anterior = p;
      return { id: p.id, fecha: p.fecha, pesoKg: p.pesoKg, gdpKgDia };
    });
  }

  async indicadores(tenantId: string) {
    const ahora = new Date();
    const inicioHoy = new Date(
      Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate()),
    );
    const finHoy = new Date(inicioHoy.getTime() + 24 * 60 * 60 * 1000);
    const inicioVentana = inicioDeMesUTC(ahora, -(MESES_INDICADORES - 1));

    const [registros, totales] = await Promise.all([
      this.prisma.registroLeche.findMany({ where: { tenantId, fecha: { gte: inicioVentana } } }),
      this.prisma.registroLecheTotal.findMany({
        where: { tenantId, fecha: { gte: inicioVentana } },
      }),
    ]);

    const registrosHoy = registros.filter((r) => r.fecha >= inicioHoy && r.fecha < finHoy);
    const totalesHoy = totales.filter((t) => t.fecha >= inicioHoy && t.fecha < finHoy);
    // El promedio por animal solo considera cargas individuales (US-2) — las
    // cargas de "total por turno" no tienen animal asociado.
    const totalHoyIndividual = registrosHoy.reduce((acc, r) => acc + Number(r.litros), 0);
    const totalHoyGlobal = totalesHoy.reduce((acc, t) => acc + Number(t.litrosTotal), 0);
    const totalHoy = totalHoyIndividual + totalHoyGlobal;
    const animalesHoy = new Set(registrosHoy.map((r) => r.animalId)).size;
    const promedioHoy = animalesHoy > 0 ? totalHoyIndividual / animalesHoy : 0;

    const totalPorMes = new Map<string, number>();
    for (const r of registros) {
      const clave = claveMs(r.fecha);
      totalPorMes.set(clave, (totalPorMes.get(clave) ?? 0) + Number(r.litros));
    }
    for (const t of totales) {
      const clave = claveMs(t.fecha);
      totalPorMes.set(clave, (totalPorMes.get(clave) ?? 0) + Number(t.litrosTotal));
    }

    const meses = Array.from({ length: MESES_INDICADORES }, (_, i) => {
      const fechaMes = inicioDeMesUTC(ahora, -(MESES_INDICADORES - 1 - i));
      const clave = claveMs(fechaMes);
      return { mes: clave, total: totalPorMes.get(clave) ?? 0 };
    });

    const mesActual = meses[meses.length - 1].total;
    const mesAnterior = meses[meses.length - 2]?.total ?? 0;
    const variacionMensualPct = mesAnterior > 0 ? ((mesActual - mesAnterior) / mesAnterior) * 100 : null;

    return { totalHoy, promedioHoy, animalesHoy, variacionMensualPct, meses };
  }
}
