import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActualizarPotreroDto } from './dto/actualizar-potrero.dto';
import { CrearPotreroDto } from './dto/crear-potrero.dto';

@Injectable()
export class PotrerosService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertNombreDisponible(
    tenantId: string,
    nombre: string,
    excluirPotreroId?: string,
  ): Promise<void> {
    const existente = await this.prisma.potrero.findUnique({
      where: { tenantId_nombre: { tenantId, nombre } },
    });
    if (existente && existente.id !== excluirPotreroId) {
      throw new ConflictException({
        code: 'NOMBRE_DUPLICADO',
        message: `Ya existe un potrero con el nombre "${nombre}" en este negocio.`,
      });
    }
  }

  private async contarAnimalesAsignados(potreroId: string): Promise<number> {
    return this.prisma.animal.count({
      where: { potreroActualId: potreroId, estado: 'ACTIVO' },
    });
  }

  // US-3.2: días desde que salió el último animal, solo tiene sentido si el
  // potrero está vacío ahora mismo. Se basa en animal_movimientos — si un
  // animal quedó asignado directamente al crearlo/editarlo (sin pasar por
  // POST /ganado/movimientos) ese evento no queda registrado acá; es una
  // limitación de datos preexistente, no de este cálculo.
  private async diasDescanso(tenantId: string, potreroId: string, ocupacionActual: number): Promise<number | null> {
    if (ocupacionActual > 0) return null;

    const ultimaSalida = await this.prisma.animalMovimiento.findFirst({
      where: { tenantId, potreroOrigenId: potreroId },
      orderBy: { fecha: 'desc' },
    });
    if (!ultimaSalida) return null;

    const dias = Math.floor((Date.now() - ultimaSalida.fecha.getTime()) / (24 * 60 * 60 * 1000));
    return Math.max(0, dias);
  }

  async crear(tenantId: string, dto: CrearPotreroDto) {
    await this.assertNombreDisponible(tenantId, dto.nombre);
    return this.prisma.potrero.create({
      data: {
        tenantId,
        nombre: dto.nombre,
        areaHectareas: dto.areaHectareas,
        tipoPasto: dto.tipoPasto,
        capacidadCarga: dto.capacidadCarga,
      },
    });
  }

  async listar(tenantId: string) {
    const potreros = await this.prisma.potrero.findMany({
      where: { tenantId },
      orderBy: { nombre: 'asc' },
    });

    const conOcupacion = await Promise.all(
      potreros.map(async (potrero) => {
        const ocupacionActual = await this.contarAnimalesAsignados(potrero.id);
        const diasDescanso = await this.diasDescanso(tenantId, potrero.id, ocupacionActual);
        return { ...potrero, ocupacionActual, diasDescanso };
      }),
    );

    return conOcupacion;
  }

  async obtener(tenantId: string, id: string) {
    const potrero = await this.prisma.potrero.findFirst({ where: { id, tenantId } });
    if (!potrero) {
      throw new NotFoundException('Potrero no encontrado.');
    }
    const ocupacionActual = await this.contarAnimalesAsignados(id);
    const diasDescanso = await this.diasDescanso(tenantId, id, ocupacionActual);
    return { ...potrero, ocupacionActual, diasDescanso };
  }

  async validarCapacidad(tenantId: string, potreroId: string, cantidadNueva: number) {
    const potrero = await this.obtener(tenantId, potreroId);
    const capacidadCarga = potrero.capacidadCarga ? Number(potrero.capacidadCarga) : null;
    const ocupacionResultante = potrero.ocupacionActual + cantidadNueva;
    const excede = capacidadCarga !== null && ocupacionResultante > capacidadCarga;
    return { excede, ocupacionActual: potrero.ocupacionActual, capacidadCarga, ocupacionResultante };
  }

  async actualizar(tenantId: string, id: string, dto: ActualizarPotreroDto) {
    await this.obtener(tenantId, id);

    if (dto.nombre) {
      await this.assertNombreDisponible(tenantId, dto.nombre, id);
    }

    return this.prisma.potrero.update({ where: { id }, data: dto });
  }

  async inactivar(tenantId: string, id: string) {
    await this.obtener(tenantId, id);

    const asignados = await this.contarAnimalesAsignados(id);
    if (asignados > 0) {
      throw new ConflictException({
        code: 'POTRERO_CON_ANIMALES',
        message: `Este potrero tiene ${asignados} animal(es) asignado(s). Movelos a otro potrero antes de inactivarlo.`,
        animalesAsignados: asignados,
      });
    }

    return this.prisma.potrero.update({ where: { id }, data: { estado: 'INACTIVO' } });
  }

  async activar(tenantId: string, id: string) {
    await this.obtener(tenantId, id);
    return this.prisma.potrero.update({ where: { id }, data: { estado: 'ACTIVO' } });
  }

  async movimientos(tenantId: string, id: string) {
    await this.obtener(tenantId, id);
    return this.prisma.animalMovimiento.findMany({
      where: { tenantId, OR: [{ potreroOrigenId: id }, { potreroDestinoId: id }] },
      include: {
        animal: { select: { id: true, identificador: true } },
        potreroOrigen: { select: { id: true, nombre: true } },
        potreroDestino: { select: { id: true, nombre: true } },
      },
      orderBy: { fecha: 'desc' },
    });
  }
}
