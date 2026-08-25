import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActualizarSuministroRecurrenteDto } from './dto/actualizar-suministro-recurrente.dto';
import { CrearAsignacionDto } from './dto/crear-asignacion.dto';
import { CrearInsumoDto } from './dto/crear-insumo.dto';
import { CrearPlanDto } from './dto/crear-plan.dto';
import { CrearSuministroRecurrenteDto } from './dto/crear-suministro-recurrente.dto';
import { CrearSuministroDto } from './dto/crear-suministro.dto';

interface Destino {
  potreroId?: string;
  animalIds?: string[];
}

const DIA_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AlimentacionService {
  constructor(private readonly prisma: PrismaService) {}

  private async validarDestino(tenantId: string, destino: Destino, maxAnimales?: number): Promise<void> {
    const tienePotrero = Boolean(destino.potreroId);
    const tieneAnimales = Boolean(destino.animalIds && destino.animalIds.length > 0);

    if (tienePotrero === tieneAnimales) {
      throw new BadRequestException(
        'Debe indicarse exactamente un destino: un potrero o un lote de animales, no ambos ni ninguno.',
      );
    }

    if (maxAnimales && destino.animalIds && destino.animalIds.length > maxAnimales) {
      throw new BadRequestException(`Este registro admite como máximo ${maxAnimales} animal(es) como destino.`);
    }

    if (tienePotrero) {
      const potrero = await this.prisma.potrero.findFirst({ where: { id: destino.potreroId, tenantId } });
      if (!potrero) {
        throw new NotFoundException('Potrero no encontrado.');
      }
    }

    if (tieneAnimales) {
      const encontrados = await this.prisma.animal.count({
        where: { id: { in: destino.animalIds }, tenantId },
      });
      if (encontrados !== destino.animalIds!.length) {
        throw new NotFoundException('Uno o más animales del lote no existen en este negocio.');
      }
    }
  }

  async crearInsumo(tenantId: string, dto: CrearInsumoDto) {
    const existente = await this.prisma.insumoAlimentacion.findUnique({
      where: { tenantId_nombre: { tenantId, nombre: dto.nombre } },
    });
    if (existente) {
      throw new ConflictException({
        code: 'NOMBRE_DUPLICADO',
        message: `Ya existe un insumo con el nombre "${dto.nombre}" en este negocio.`,
      });
    }

    return this.prisma.insumoAlimentacion.create({
      data: {
        tenantId,
        nombre: dto.nombre,
        unidadMedida: dto.unidadMedida,
        costoUnitario: dto.costoUnitario,
      },
    });
  }

  listarInsumos(tenantId: string) {
    return this.prisma.insumoAlimentacion.findMany({
      where: { tenantId, estado: 'ACTIVO' },
      orderBy: { nombre: 'asc' },
    });
  }

  private async obtenerInsumo(tenantId: string, id: string) {
    const insumo = await this.prisma.insumoAlimentacion.findFirst({ where: { id, tenantId } });
    if (!insumo) {
      throw new NotFoundException('Insumo no encontrado.');
    }
    return insumo;
  }

  async inactivarInsumo(tenantId: string, id: string) {
    await this.obtenerInsumo(tenantId, id);
    return this.prisma.insumoAlimentacion.update({ where: { id }, data: { estado: 'INACTIVO' } });
  }

  async activarInsumo(tenantId: string, id: string) {
    await this.obtenerInsumo(tenantId, id);
    return this.prisma.insumoAlimentacion.update({ where: { id }, data: { estado: 'ACTIVO' } });
  }

  async crearPlan(tenantId: string, dto: CrearPlanDto) {
    const existente = await this.prisma.planAlimentacion.findUnique({
      where: { tenantId_nombre: { tenantId, nombre: dto.nombre } },
    });
    if (existente) {
      throw new ConflictException({
        code: 'NOMBRE_DUPLICADO',
        message: `Ya existe un plan de alimentación con el nombre "${dto.nombre}" en este negocio.`,
      });
    }

    const insumoIds = dto.items.map((item) => item.insumoId);
    const insumosEncontrados = await this.prisma.insumoAlimentacion.count({
      where: { id: { in: insumoIds }, tenantId },
    });
    if (insumosEncontrados !== new Set(insumoIds).size) {
      throw new NotFoundException('Uno o más insumos del plan no existen en este negocio.');
    }

    return this.prisma.$transaction(async (tx) => {
      const plan = await tx.planAlimentacion.create({
        data: { tenantId, nombre: dto.nombre, tipo: dto.tipo },
      });
      await tx.planAlimentacionItem.createMany({
        data: dto.items.map((item) => ({
          planId: plan.id,
          insumoId: item.insumoId,
          cantidad: item.cantidad,
          unidadTiempo: item.unidadTiempo,
          por: item.por,
        })),
      });
      return tx.planAlimentacion.findUniqueOrThrow({
        where: { id: plan.id },
        include: { items: { include: { insumo: true } } },
      });
    });
  }

  listarPlanes(tenantId: string) {
    return this.prisma.planAlimentacion.findMany({
      where: { tenantId, estado: 'ACTIVO' },
      include: { items: { include: { insumo: true } } },
      orderBy: { nombre: 'asc' },
    });
  }

  async crearAsignacion(tenantId: string, planId: string, dto: CrearAsignacionDto) {
    const plan = await this.prisma.planAlimentacion.findFirst({ where: { id: planId, tenantId } });
    if (!plan) {
      throw new NotFoundException('Plan de alimentación no encontrado.');
    }
    if (plan.estado !== 'ACTIVO') {
      throw new BadRequestException('No se puede asignar un plan inactivo.');
    }

    await this.validarDestino(tenantId, { potreroId: dto.potreroId, animalIds: dto.animalIds });

    return this.prisma.planAsignacion.create({
      data: {
        tenantId,
        planId,
        potreroId: dto.potreroId,
        animalIds: dto.animalIds ?? [],
        fechaInicio: new Date(dto.fechaInicio),
        fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : undefined,
      },
      include: { potrero: true },
    });
  }

  async crearSuministro(tenantId: string, dto: CrearSuministroDto, registradoPorId: string) {
    const insumo = await this.obtenerInsumo(tenantId, dto.insumoId);
    await this.validarDestino(tenantId, { potreroId: dto.potreroId, animalIds: dto.animalIds }, 1);

    return this.prisma.suministro.create({
      data: {
        tenantId,
        fecha: new Date(dto.fecha),
        insumoId: insumo.id,
        potreroId: dto.potreroId,
        animalIds: dto.animalIds ?? [],
        cantidad: dto.cantidad,
        registradoPorId,
      },
      include: { insumo: true, potrero: true },
    });
  }

  // US-2.2: sin job en background (no hay Redis/BullMQ en el proyecto) — se
  // materializan las filas de `suministros` pendientes de las reglas activas
  // hasta hoy en el momento de leer, en vez de un cron diario. El resultado
  // persistido es el mismo (filas reales, editable/cancelable sin tocar el
  // histórico ya generado), sin infraestructura nueva.
  private async catchUpRecurrentes(tenantId: string): Promise<void> {
    const ahora = new Date();
    const hoy = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate()));

    const reglas = await this.prisma.suministroRecurrente.findMany({
      where: {
        tenantId,
        activo: true,
        fechaInicio: { lte: hoy },
        OR: [{ fechaFin: null }, { fechaFin: { gte: hoy } }],
      },
    });
    if (reglas.length === 0) return;

    for (const regla of reglas) {
      const existentes = await this.prisma.suministro.findMany({
        where: { tenantId, recurrenciaId: regla.id },
        select: { fecha: true },
      });
      const fechasExistentes = new Set(existentes.map((s) => s.fecha.getTime()));

      const pasoMs = regla.frecuencia === 'SEMANAL' ? 7 * DIA_MS : DIA_MS;
      const pendientes: Date[] = [];
      for (let t = regla.fechaInicio.getTime(); t <= hoy.getTime(); t += pasoMs) {
        if (!fechasExistentes.has(t)) pendientes.push(new Date(t));
      }
      if (pendientes.length === 0) continue;

      await this.prisma.suministro.createMany({
        data: pendientes.map((fecha) => ({
          tenantId,
          fecha,
          insumoId: regla.insumoId,
          potreroId: regla.potreroId,
          animalIds: regla.animalIds,
          cantidad: regla.cantidad,
          registradoPorId: regla.creadoPorId,
          esRecurrente: true,
          recurrenciaId: regla.id,
        })),
      });
    }
  }

  async crearSuministroRecurrente(tenantId: string, dto: CrearSuministroRecurrenteDto, creadoPorId: string) {
    const insumo = await this.obtenerInsumo(tenantId, dto.insumoId);
    await this.validarDestino(tenantId, { potreroId: dto.potreroId, animalIds: dto.animalIds }, 1);

    const regla = await this.prisma.suministroRecurrente.create({
      data: {
        tenantId,
        insumoId: insumo.id,
        potreroId: dto.potreroId,
        animalIds: dto.animalIds ?? [],
        cantidad: dto.cantidad,
        frecuencia: dto.frecuencia,
        fechaInicio: new Date(dto.fechaInicio),
        fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : undefined,
        creadoPorId,
      },
      include: { insumo: true, potrero: true },
    });

    await this.catchUpRecurrentes(tenantId);
    return regla;
  }

  async actualizarSuministroRecurrente(tenantId: string, id: string, dto: ActualizarSuministroRecurrenteDto) {
    const regla = await this.prisma.suministroRecurrente.findFirst({ where: { id, tenantId } });
    if (!regla) {
      throw new NotFoundException('Regla de suministro recurrente no encontrada.');
    }

    return this.prisma.suministroRecurrente.update({
      where: { id },
      data: {
        cantidad: dto.cantidad,
        fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : undefined,
        activo: dto.activo,
      },
      include: { insumo: true, potrero: true },
    });
  }

  listarSuministrosRecurrentes(tenantId: string) {
    return this.prisma.suministroRecurrente.findMany({
      where: { tenantId },
      include: { insumo: true, potrero: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listarSuministros(tenantId: string) {
    await this.catchUpRecurrentes(tenantId);
    return this.prisma.suministro.findMany({
      where: { tenantId },
      include: { insumo: true, potrero: true },
      orderBy: { fecha: 'desc' },
      take: 50,
    });
  }

  async costos(tenantId: string, desde?: Date, hasta?: Date, potreroId?: string) {
    await this.catchUpRecurrentes(tenantId);
    const suministros = await this.prisma.suministro.findMany({
      where: {
        tenantId,
        ...((desde || hasta) && { fecha: { gte: desde, lte: hasta } }),
        // Solo alcanza a suministros cargados directamente sobre el potrero
        // (no a los que apuntan a animales individuales que hoy pastan ahí —
        // `animalIds` es un array plano, sin join posible contra Animal).
        ...(potreroId && { potreroId }),
      },
      include: { insumo: true },
    });

    const porInsumo = new Map<
      string,
      { insumoId: string; nombre: string; cantidad: number; costoUnitario: number | null; costoTotal: number | null }
    >();

    for (const s of suministros) {
      const cantidad = Number(s.cantidad);
      const costoUnitario = s.insumo.costoUnitario !== null ? Number(s.insumo.costoUnitario) : null;
      const acumulado = porInsumo.get(s.insumoId);
      if (acumulado) {
        acumulado.cantidad += cantidad;
        acumulado.costoTotal = costoUnitario !== null ? (acumulado.costoTotal ?? 0) + cantidad * costoUnitario : acumulado.costoTotal;
      } else {
        porInsumo.set(s.insumoId, {
          insumoId: s.insumoId,
          nombre: s.insumo.nombre,
          cantidad,
          costoUnitario,
          costoTotal: costoUnitario !== null ? cantidad * costoUnitario : null,
        });
      }
    }

    const porTipo = Array.from(porInsumo.values()).sort((a, b) => (b.costoTotal ?? 0) - (a.costoTotal ?? 0));
    const consumoTotalKg = porTipo.reduce((acc, i) => acc + i.cantidad, 0);
    const costoTotalGeneral = porTipo.reduce((acc, i) => acc + (i.costoTotal ?? 0), 0);
    const costoParcial = porTipo.some((i) => i.costoTotal === null);

    const animalesActivos = await this.prisma.animal.count({ where: { tenantId, estado: 'ACTIVO' } });
    const consumoPromedioPorAnimal = animalesActivos > 0 ? consumoTotalKg / animalesActivos : 0;

    return { porTipo, consumoTotalKg, costoTotalGeneral, costoParcial, consumoPromedioPorAnimal };
  }
}
