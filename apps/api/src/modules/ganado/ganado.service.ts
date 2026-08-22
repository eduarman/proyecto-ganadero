import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { calcularCategoriaEtaria } from './categoria-etaria.util';
import { ActualizarAnimalDto } from './dto/actualizar-animal.dto';
import { CrearAnimalDto } from './dto/crear-animal.dto';
import { DarBajaDto } from './dto/dar-baja.dto';
import { ListarAnimalesQueryDto } from './dto/listar-animales-query.dto';
import { MoverAnimalesDto } from './dto/mover-animales.dto';

const GENEALOGIA_SELECT = { select: { id: true, identificador: true } } as const;

@Injectable()
export class GanadoService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertIdentificadorDisponible(
    tenantId: string,
    identificador: string,
    excluirAnimalId?: string,
  ): Promise<void> {
    const existente = await this.prisma.animal.findUnique({
      where: { tenantId_identificador: { tenantId, identificador } },
    });
    if (existente && existente.id !== excluirAnimalId) {
      throw new ConflictException({
        code: 'IDENTIFICADOR_DUPLICADO',
        message: `Ya existe un animal con el identificador "${identificador}" en este negocio.`,
      });
    }
  }

  private async assertGenealogia(tenantId: string, madreId?: string, padreId?: string): Promise<void> {
    if (madreId) {
      const madre = await this.prisma.animal.findFirst({ where: { id: madreId, tenantId } });
      if (!madre) throw new NotFoundException('La madre indicada no existe en este negocio.');
      if (madre.sexo !== 'HEMBRA') throw new BadRequestException('La madre indicada debe ser hembra.');
    }
    if (padreId) {
      const padre = await this.prisma.animal.findFirst({ where: { id: padreId, tenantId } });
      if (!padre) throw new NotFoundException('El padre indicado no existe en este negocio.');
      if (padre.sexo !== 'MACHO') throw new BadRequestException('El padre indicado debe ser macho.');
    }
  }

  async crear(tenantId: string, dto: CrearAnimalDto) {
    await this.assertIdentificadorDisponible(tenantId, dto.identificador);
    await this.assertGenealogia(tenantId, dto.madreId, dto.padreId);

    const fechaNacimiento = dto.fechaNacimiento ? new Date(dto.fechaNacimiento) : null;
    const categoria =
      dto.categoria ?? calcularCategoriaEtaria(fechaNacimiento, dto.sexo, dto.especie) ?? undefined;

    return this.prisma.animal.create({
      data: {
        tenantId,
        identificador: dto.identificador,
        especie: dto.especie,
        sexo: dto.sexo,
        fechaNacimiento,
        categoria,
        raza: dto.raza,
        color: dto.color,
        pesoNacimiento: dto.pesoNacimiento,
        madreId: dto.madreId,
        padreId: dto.padreId,
        madreRefExterna: dto.madreRefExterna,
        padreRefExterna: dto.padreRefExterna,
        fotoUrl: dto.fotoUrl,
        potreroActualId: dto.potreroActualId,
      },
    });
  }

  async listar(tenantId: string, query: ListarAnimalesQueryDto) {
    const ahora = new Date();
    // edadMinMeses: el animal tiene AL MENOS esa edad -> nació antes de (hoy - min meses).
    // edadMaxMeses: el animal tiene COMO MUCHO esa edad -> nació después de (hoy - max meses).
    const fechaNacimientoMax = query.edadMinMeses
      ? new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() - query.edadMinMeses, ahora.getUTCDate()))
      : undefined;
    const fechaNacimientoMin = query.edadMaxMeses
      ? new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() - query.edadMaxMeses, ahora.getUTCDate()))
      : undefined;

    const where: Prisma.AnimalWhereInput = {
      tenantId,
      ...(query.estado && { estado: query.estado }),
      ...(query.sexo && { sexo: query.sexo }),
      ...(query.categoria && { categoria: query.categoria }),
      ...(query.potreroActualId && { potreroActualId: query.potreroActualId }),
      ...(query.search && {
        identificador: { contains: query.search, mode: 'insensitive' },
      }),
      ...((fechaNacimientoMin || fechaNacimientoMax) && {
        fechaNacimiento: { gte: fechaNacimientoMin, lte: fechaNacimientoMax },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.animal.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.animal.count({ where }),
    ]);

    return { data, total, page: query.page, limit: query.limit };
  }

  async obtener(tenantId: string, id: string) {
    const animal = await this.prisma.animal.findFirst({
      where: { id, tenantId },
      include: { madre: GENEALOGIA_SELECT, padre: GENEALOGIA_SELECT },
    });
    if (!animal) {
      throw new NotFoundException('Animal no encontrado.');
    }
    return animal;
  }

  async actualizar(tenantId: string, id: string, dto: ActualizarAnimalDto) {
    await this.obtener(tenantId, id);

    if (dto.identificador) {
      await this.assertIdentificadorDisponible(tenantId, dto.identificador, id);
    }
    await this.assertGenealogia(tenantId, dto.madreId, dto.padreId);

    return this.prisma.animal.update({
      where: { id },
      data: {
        ...dto,
        fechaNacimiento: dto.fechaNacimiento ? new Date(dto.fechaNacimiento) : undefined,
      },
    });
  }

  async darBaja(tenantId: string, id: string, dto: DarBajaDto, usuarioId: string) {
    await this.obtener(tenantId, id);

    if (!dto.confirmarConEventosPendientes) {
      // US-4.3: advertir (no bloquear) si el animal tiene un servicio
      // reproductivo sin cerrar (sin diagnóstico negativo ni parto) —
      // consulta directa a Servicio, sin depender de ReproduccionModule
      // para evitar un import circular (ReproduccionModule ya importa
      // GanadoModule para dar de alta crías).
      const eventoPendiente = await this.prisma.servicio.findFirst({
        where: { tenantId, animalId: id, estado: { not: 'VACIO' }, parto: null },
      });
      if (eventoPendiente) {
        throw new ConflictException({
          code: 'EVENTOS_REPRODUCTIVOS_PENDIENTES',
          message:
            'Este animal tiene un evento reproductivo sin cerrar (servicio con diagnóstico pendiente o preñez confirmada). Confirmá si igual querés darlo de baja.',
          servicioId: eventoPendiente.id,
        });
      }
    }

    const [, baja] = await this.prisma.$transaction([
      this.prisma.animal.update({ where: { id }, data: { estado: 'INACTIVO' } }),
      this.prisma.animalBaja.create({
        data: {
          tenantId,
          animalId: id,
          motivo: dto.motivo,
          fecha: new Date(dto.fecha),
          observaciones: dto.observaciones,
          usuarioId,
        },
      }),
    ]);

    return baja;
  }

  async moverAnimales(tenantId: string, dto: MoverAnimalesDto, usuarioId: string) {
    const potreroDestino = await this.prisma.potrero.findFirst({
      where: { id: dto.potreroDestinoId, tenantId },
    });
    if (!potreroDestino) {
      throw new NotFoundException('Potrero destino no encontrado.');
    }
    if (potreroDestino.estado !== 'ACTIVO') {
      throw new BadRequestException('No se puede mover animales a un potrero inactivo.');
    }

    const animalIdsUnicos = Array.from(new Set(dto.animalIds));
    const animales = await this.prisma.animal.findMany({
      where: { id: { in: animalIdsUnicos }, tenantId },
    });
    if (animales.length !== animalIdsUnicos.length) {
      throw new NotFoundException('Uno o más animales no existen en este negocio.');
    }

    const fecha = new Date(dto.fecha);
    const movimientos = await this.prisma.$transaction(
      animales.flatMap((animal) => [
        this.prisma.animalMovimiento.create({
          data: {
            tenantId,
            animalId: animal.id,
            potreroOrigenId: animal.potreroActualId,
            potreroDestinoId: dto.potreroDestinoId,
            fecha,
            usuarioId,
          },
        }),
        this.prisma.animal.update({
          where: { id: animal.id },
          data: { potreroActualId: dto.potreroDestinoId },
        }),
      ]),
    );

    // El resultado del transaction alterna [movimiento, animal, movimiento, animal, ...] —
    // nos quedamos solo con los movimientos creados (índices pares).
    return movimientos.filter((_, i) => i % 2 === 0);
  }

  async movimientosDeAnimal(tenantId: string, id: string) {
    await this.obtener(tenantId, id);
    return this.prisma.animalMovimiento.findMany({
      where: { tenantId, animalId: id },
      include: {
        potreroOrigen: { select: { id: true, nombre: true } },
        potreroDestino: { select: { id: true, nombre: true } },
      },
      orderBy: { fecha: 'desc' },
    });
  }
}
