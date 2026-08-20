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
      potreros.map(async (potrero) => ({
        ...potrero,
        ocupacionActual: await this.contarAnimalesAsignados(potrero.id),
      })),
    );

    return conOcupacion;
  }

  async obtener(tenantId: string, id: string) {
    const potrero = await this.prisma.potrero.findFirst({ where: { id, tenantId } });
    if (!potrero) {
      throw new NotFoundException('Potrero no encontrado.');
    }
    const ocupacionActual = await this.contarAnimalesAsignados(id);
    return { ...potrero, ocupacionActual };
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
}
