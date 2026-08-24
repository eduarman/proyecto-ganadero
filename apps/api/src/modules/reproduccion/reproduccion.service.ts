import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { GanadoService } from '../ganado/ganado.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearCeloDto } from './dto/crear-celo.dto';
import { CrearDesteteDto } from './dto/crear-destete.dto';
import { CrearDiagnosticoDto } from './dto/crear-diagnostico.dto';
import { CrearPartoDto } from './dto/crear-parto.dto';
import { CrearServicioDto } from './dto/crear-servicio.dto';
import {
  CICLO_CELO_DIAS,
  EDAD_DESTETE_DIAS,
  calcularFechaEstimadaDiagnostico,
  calcularFechaProbableParto,
} from './fechas-estimadas.util';

const DIA_MS = 24 * 60 * 60 * 1000;
const DIAS_VENTANA_ALERTA = 7;

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

  async crearCelo(tenantId: string, dto: CrearCeloDto) {
    const animal = await this.prisma.animal.findFirst({ where: { id: dto.animalId, tenantId } });
    if (!animal) {
      throw new NotFoundException('Animal no encontrado.');
    }
    if (animal.sexo !== 'HEMBRA') {
      throw new BadRequestException('El celo se registra sobre una hembra.');
    }

    return this.prisma.celo.create({
      data: {
        tenantId,
        animalId: dto.animalId,
        fecha: new Date(dto.fecha),
        observaciones: dto.observaciones,
      },
      include: { animal: true },
    });
  }

  async crearDestete(tenantId: string, dto: CrearDesteteDto) {
    const animal = await this.prisma.animal.findFirst({ where: { id: dto.animalId, tenantId } });
    if (!animal) {
      throw new NotFoundException('Animal no encontrado.');
    }

    const existente = await this.prisma.destete.findUnique({
      where: { tenantId_animalId: { tenantId, animalId: dto.animalId } },
    });
    if (existente) {
      throw new ConflictException({
        code: 'DESTETE_YA_REGISTRADO',
        message: 'Este animal ya tiene un destete registrado.',
      });
    }

    return this.prisma.destete.create({
      data: {
        tenantId,
        animalId: dto.animalId,
        fecha: new Date(dto.fecha),
        pesoDestete: dto.pesoDestete,
      },
      include: { animal: true },
    });
  }

  listarServicios(tenantId: string, animalId?: string) {
    return this.prisma.servicio.findMany({
      where: { tenantId, ...(animalId && { animalId }) },
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

  private async celosEsperados(tenantId: string, ahora: Date, limite: Date) {
    const celos = await this.prisma.celo.findMany({
      where: { tenantId },
      include: { animal: { select: { id: true, identificador: true } } },
      orderBy: { fecha: 'desc' },
    });

    // Un solo celo por animal: el más reciente (celos ya viene ordenado desc).
    const ultimoCeloPorAnimal = new Map<string, (typeof celos)[number]>();
    for (const c of celos) {
      if (!ultimoCeloPorAnimal.has(c.animalId)) ultimoCeloPorAnimal.set(c.animalId, c);
    }

    const animalIds = Array.from(ultimoCeloPorAnimal.keys());
    const servicios = animalIds.length
      ? await this.prisma.servicio.findMany({
          where: { tenantId, animalId: { in: animalIds } },
          orderBy: { fecha: 'desc' },
        })
      : [];
    const ultimoServicioPorAnimal = new Map<string, Date>();
    for (const s of servicios) {
      if (!ultimoServicioPorAnimal.has(s.animalId)) ultimoServicioPorAnimal.set(s.animalId, s.fecha);
    }

    const resultado: {
      id: string;
      animal: { id: string; identificador: string };
      fechaEsperada: Date;
      vencido: boolean;
    }[] = [];

    for (const [animalId, celo] of ultimoCeloPorAnimal) {
      // Si ya hubo un servicio después de este celo, el animal fue servida y
      // ya no corresponde recordarle el próximo celo esperado.
      const ultimoServicio = ultimoServicioPorAnimal.get(animalId);
      if (ultimoServicio && ultimoServicio > celo.fecha) continue;

      const fechaEsperada = new Date(celo.fecha.getTime() + CICLO_CELO_DIAS * DIA_MS);
      if (fechaEsperada > limite) continue;

      resultado.push({
        id: celo.id,
        animal: celo.animal,
        fechaEsperada,
        vencido: fechaEsperada < ahora,
      });
    }

    return resultado;
  }

  private async destetesSugeridos(tenantId: string, ahora: Date) {
    const [animales, destetes] = await Promise.all([
      this.prisma.animal.findMany({ where: { tenantId, estado: 'ACTIVO' } }),
      this.prisma.destete.findMany({ where: { tenantId }, select: { animalId: true } }),
    ]);
    const yaDestetados = new Set(destetes.map((d) => d.animalId));

    return animales
      .filter((a) => a.fechaNacimiento && !yaDestetados.has(a.id))
      .map((a) => ({
        id: a.id,
        identificador: a.identificador,
        fechaNacimiento: a.fechaNacimiento as Date,
        edadDias: Math.floor((ahora.getTime() - (a.fechaNacimiento as Date).getTime()) / DIA_MS),
      }))
      .filter((a) => a.edadDias >= EDAD_DESTETE_DIAS);
  }

  async calendario(tenantId: string) {
    const ahora = new Date();
    const limite = new Date(ahora.getTime() + DIAS_VENTANA_ALERTA * DIA_MS);

    const [partosProximos, serviciosPendientes, celosEsperados, destetesSugeridos] = await Promise.all([
      this.prisma.servicio.findMany({
        where: { tenantId, estado: 'CONFIRMADO_PRENADA', parto: null },
        include: { animal: true },
        orderBy: { fechaProbableParto: 'asc' },
      }),
      this.pendientesDiagnostico(tenantId),
      this.celosEsperados(tenantId, ahora, limite),
      this.destetesSugeridos(tenantId, ahora),
    ]);

    const diagnosticosPendientes = serviciosPendientes.map((s) => ({
      ...s,
      vencido: s.fechaEstimadaDiagnostico < ahora,
    }));

    return { partosProximos, diagnosticosPendientes, celosEsperados, destetesSugeridos };
  }
}
