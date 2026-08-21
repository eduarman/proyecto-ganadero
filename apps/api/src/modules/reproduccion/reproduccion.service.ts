import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { GanadoService } from '../ganado/ganado.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearDiagnosticoDto } from './dto/crear-diagnostico.dto';
import { CrearPartoDto } from './dto/crear-parto.dto';
import { CrearServicioDto } from './dto/crear-servicio.dto';
import { calcularFechaEstimadaDiagnostico, calcularFechaProbableParto } from './fechas-estimadas.util';

@Injectable()
export class ReproduccionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ganadoService: GanadoService,
  ) {}

  private servicioActivo(tenantId: string, animalId: string) {
    return this.prisma.servicio.findFirst({
      where: { tenantId, animalId, estado: { not: 'VACIO' }, parto: null },
      orderBy: { fecha: 'desc' },
    });
  }

  async crearServicio(tenantId: string, dto: CrearServicioDto) {
    const animal = await this.prisma.animal.findFirst({ where: { id: dto.animalId, tenantId } });
    if (!animal) {
      throw new NotFoundException('Animal no encontrado.');
    }
    if (animal.sexo !== 'HEMBRA') {
      throw new BadRequestException('El servicio reproductivo se registra sobre una hembra.');
    }

    if (!dto.confirmarDuplicado) {
      const activo = await this.servicioActivo(tenantId, dto.animalId);
      if (activo) {
        throw new ConflictException({
          code: 'SERVICIO_ACTIVO_EXISTENTE',
          message:
            'Este animal ya tiene un servicio activo sin cerrar (sin diagnóstico negativo ni parto registrado). Confirmá si igual querés registrar uno nuevo.',
          servicioActivoId: activo.id,
        });
      }
    }

    const fecha = new Date(dto.fecha);

    return this.prisma.servicio.create({
      data: {
        tenantId,
        animalId: dto.animalId,
        tipo: dto.tipo,
        fecha,
        machoId: dto.machoId,
        semenReferencia: dto.semenReferencia,
        fechaEstimadaDiagnostico: calcularFechaEstimadaDiagnostico(fecha),
        fechaProbableParto: calcularFechaProbableParto(fecha, animal.especie),
      },
      include: { animal: true },
    });
  }

  async crearDiagnostico(tenantId: string, dto: CrearDiagnosticoDto) {
    const servicio = await this.prisma.servicio.findFirst({
      where: { id: dto.servicioId, tenantId },
    });
    if (!servicio) {
      throw new NotFoundException('Servicio no encontrado.');
    }

    const nuevoEstado =
      dto.resultado === 'VACIA' ? 'VACIO' : dto.resultado === 'PRENADA' ? 'CONFIRMADO_PRENADA' : servicio.estado;

    const [, diagnostico] = await this.prisma.$transaction([
      this.prisma.servicio.update({ where: { id: servicio.id }, data: { estado: nuevoEstado } }),
      this.prisma.diagnosticoGestacion.create({
        data: {
          tenantId,
          servicioId: servicio.id,
          resultado: dto.resultado,
          metodo: dto.metodo,
          fecha: new Date(dto.fecha),
        },
      }),
    ]);

    return diagnostico;
  }

  async crearParto(tenantId: string, dto: CrearPartoDto) {
    const madre = await this.prisma.animal.findFirst({ where: { id: dto.madreId, tenantId } });
    if (!madre) {
      throw new NotFoundException('Animal no encontrado.');
    }

    let servicioId: string | undefined;
    if (dto.servicioId) {
      const servicio = await this.prisma.servicio.findFirst({
        where: { id: dto.servicioId, tenantId, animalId: dto.madreId },
      });
      if (!servicio) {
        throw new NotFoundException('Servicio no encontrado para este animal.');
      }
      servicioId = servicio.id;
    }

    let criaAnimalId: string | undefined;
    if (!dto.mortinato && dto.criaIdentificador) {
      const cria = await this.ganadoService.crear(tenantId, {
        identificador: dto.criaIdentificador,
        especie: madre.especie,
        sexo: dto.criaSexo ?? 'HEMBRA',
        fechaNacimiento: dto.fecha,
        madreRefExterna: madre.identificador,
        potreroActualId: madre.potreroActualId ?? undefined,
      });
      criaAnimalId = cria.id;
    }

    return this.prisma.parto.create({
      data: {
        tenantId,
        madreId: dto.madreId,
        servicioId,
        fecha: new Date(dto.fecha),
        tipo: dto.tipo,
        mortinato: dto.mortinato ?? false,
        observaciones: dto.observaciones,
        criaAnimalId,
      },
      include: { madre: true, cria: true },
    });
  }

  listarServicios(tenantId: string) {
    return this.prisma.servicio.findMany({
      where: { tenantId },
      include: { animal: true, diagnosticos: true, parto: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  pendientesDiagnostico(tenantId: string) {
    return this.prisma.servicio.findMany({
      where: { tenantId, estado: 'PENDIENTE_DIAGNOSTICO' },
      include: { animal: true },
      orderBy: { fechaEstimadaDiagnostico: 'asc' },
    });
  }

  contarPrenadas(tenantId: string) {
    return this.prisma.servicio.count({
      where: { tenantId, estado: 'CONFIRMADO_PRENADA', parto: null },
    });
  }

  calendario(tenantId: string) {
    return this.prisma.servicio.findMany({
      where: { tenantId, estado: 'CONFIRMADO_PRENADA', parto: null },
      include: { animal: true },
      orderBy: { fechaProbableParto: 'asc' },
    });
  }
}
