import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActualizarProtocoloDto } from './dto/actualizar-protocolo.dto';
import { CrearAplicacionLoteDto } from './dto/crear-aplicacion-lote.dto';
import { CrearAplicacionDto } from './dto/crear-aplicacion.dto';
import { CrearCuarentenaDto } from './dto/crear-cuarentena.dto';
import { CrearDiagnosticoDto } from './dto/crear-diagnostico.dto';
import { CrearProductoSanitarioDto } from './dto/crear-producto-sanitario.dto';
import { CrearProtocoloDto } from './dto/crear-protocolo.dto';
import { FinalizarCuarentenaDto } from './dto/finalizar-cuarentena.dto';
import { ListarAplicacionesQueryDto } from './dto/listar-aplicaciones-query.dto';

const DIAS_ALERTA_PROXIMA = 7;
const DIA_MS = 24 * 60 * 60 * 1000;

// Nunca usar `include: { responsable: true }` a secas — Usuario tiene
// passwordHash y no debe filtrarse en las respuestas de esta API.
const RESPONSABLE_SELECT = { select: { id: true, nombre: true } } as const;

@Injectable()
export class SanidadService {
  constructor(private readonly prisma: PrismaService) {}

  async crearProducto(tenantId: string, dto: CrearProductoSanitarioDto) {
    const existente = await this.prisma.productoSanitario.findUnique({
      where: { tenantId_nombre: { tenantId, nombre: dto.nombre } },
    });
    if (existente) {
      throw new ConflictException({
        code: 'NOMBRE_DUPLICADO',
        message: `Ya existe un producto sanitario con el nombre "${dto.nombre}" en este negocio.`,
      });
    }

    return this.prisma.productoSanitario.create({
      data: {
        tenantId,
        nombre: dto.nombre,
        tipo: dto.tipo,
        dosisRecomendada: dto.dosisRecomendada,
        intervaloRefuerzoDias: dto.intervaloRefuerzoDias,
      },
    });
  }

  listarProductos(tenantId: string) {
    return this.prisma.productoSanitario.findMany({
      where: { tenantId, estado: 'ACTIVO' },
      orderBy: { nombre: 'asc' },
    });
  }

  async crearProtocolo(tenantId: string, dto: CrearProtocoloDto) {
    const producto = await this.prisma.productoSanitario.findFirst({
      where: { id: dto.productoId, tenantId },
    });
    if (!producto) {
      throw new NotFoundException('Producto sanitario no encontrado.');
    }

    return this.prisma.protocoloSanitario.create({
      data: {
        tenantId,
        nombre: dto.nombre,
        productoId: dto.productoId,
        edadInicioDias: dto.edadInicioDias,
        frecuenciaDias: dto.frecuenciaDias,
        especie: dto.especie,
        sexo: dto.sexo,
        categoria: dto.categoria,
      },
      include: { producto: true },
    });
  }

  listarProtocolos(tenantId: string) {
    return this.prisma.protocoloSanitario.findMany({
      where: { tenantId },
      include: { producto: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async actualizarProtocolo(tenantId: string, id: string, dto: ActualizarProtocoloDto) {
    const protocolo = await this.prisma.protocoloSanitario.findFirst({ where: { id, tenantId } });
    if (!protocolo) {
      throw new NotFoundException('Protocolo no encontrado.');
    }

    if (dto.productoId) {
      const producto = await this.prisma.productoSanitario.findFirst({
        where: { id: dto.productoId, tenantId },
      });
      if (!producto) {
        throw new NotFoundException('Producto sanitario no encontrado.');
      }
    }

    return this.prisma.protocoloSanitario.update({
      where: { id },
      data: dto,
      include: { producto: true },
    });
  }

  async crearAplicacion(tenantId: string, dto: CrearAplicacionDto, responsableId: string) {
    const animal = await this.prisma.animal.findFirst({
      where: { id: dto.animalId, tenantId },
    });
    if (!animal) {
      throw new NotFoundException('Animal no encontrado.');
    }

    const producto = await this.prisma.productoSanitario.findFirst({
      where: { id: dto.productoId, tenantId },
    });
    if (!producto) {
      throw new NotFoundException('Producto sanitario no encontrado.');
    }

    const fecha = new Date(dto.fecha);
    const proximaFechaEsperada = producto.intervaloRefuerzoDias
      ? new Date(fecha.getTime() + producto.intervaloRefuerzoDias * 24 * 60 * 60 * 1000)
      : null;

    return this.prisma.aplicacionSanitaria.create({
      data: {
        tenantId,
        animalId: dto.animalId,
        productoId: dto.productoId,
        fecha,
        dosisAplicada: dto.dosisAplicada,
        observaciones: dto.observaciones,
        responsableId,
        proximaFechaEsperada,
      },
      include: { producto: true, responsable: RESPONSABLE_SELECT },
    });
  }

  async crearAplicacionLote(tenantId: string, dto: CrearAplicacionLoteDto, responsableId: string) {
    const producto = await this.prisma.productoSanitario.findFirst({
      where: { id: dto.productoId, tenantId },
    });
    if (!producto) {
      throw new NotFoundException('Producto sanitario no encontrado.');
    }

    const animalIdsUnicos = Array.from(new Set(dto.animalIds));
    const animales = await this.prisma.animal.findMany({
      where: { id: { in: animalIdsUnicos }, tenantId },
    });
    if (animales.length !== animalIdsUnicos.length) {
      throw new NotFoundException('Uno o más animales no existen en este negocio.');
    }

    const fecha = new Date(dto.fecha);
    const proximaFechaEsperada = producto.intervaloRefuerzoDias
      ? new Date(fecha.getTime() + producto.intervaloRefuerzoDias * DIA_MS)
      : null;

    return this.prisma.$transaction(
      animalIdsUnicos.map((animalId) =>
        this.prisma.aplicacionSanitaria.create({
          data: {
            tenantId,
            animalId,
            productoId: dto.productoId,
            fecha,
            dosisAplicada: dto.dosisAplicada,
            observaciones: dto.observaciones,
            responsableId,
            proximaFechaEsperada,
          },
        }),
      ),
    );
  }

  async listar(tenantId: string, query: ListarAplicacionesQueryDto) {
    const where = { tenantId };
    const [data, total] = await Promise.all([
      this.prisma.aplicacionSanitaria.findMany({
        where,
        include: { producto: true, animal: true, responsable: RESPONSABLE_SELECT },
        orderBy: { fecha: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.aplicacionSanitaria.count({ where }),
    ]);

    return { data, total, page: query.page, limit: query.limit };
  }

  async historialAnimal(tenantId: string, animalId: string) {
    const animal = await this.prisma.animal.findFirst({ where: { id: animalId, tenantId } });
    if (!animal) {
      throw new NotFoundException('Animal no encontrado.');
    }

    return this.prisma.aplicacionSanitaria.findMany({
      where: { tenantId, animalId },
      include: { producto: true, responsable: RESPONSABLE_SELECT },
      orderBy: { fecha: 'desc' },
    });
  }

  private async alertasRefuerzos(tenantId: string) {
    const limite = new Date(Date.now() + DIAS_ALERTA_PROXIMA * 24 * 60 * 60 * 1000);
    const ahora = new Date();

    const aplicaciones = await this.prisma.aplicacionSanitaria.findMany({
      where: {
        tenantId,
        proximaFechaEsperada: { not: null, lte: limite },
      },
      include: { producto: true, animal: true, responsable: RESPONSABLE_SELECT },
      orderBy: { proximaFechaEsperada: 'asc' },
    });

    return aplicaciones.map((a) => ({
      ...a,
      tipo: 'REFUERZO' as const,
      vencido: a.proximaFechaEsperada !== null && a.proximaFechaEsperada < ahora,
    }));
  }

  // US-1.2: sin job en background (no hay Redis/BullMQ en el proyecto) — se
  // evalúan los protocolos activos contra el padrón de animales en el momento
  // de pedir las alertas, sin persistir "aplicaciones esperadas".
  private async protocolosPendientes(tenantId: string) {
    const protocolos = await this.prisma.protocoloSanitario.findMany({
      where: { tenantId, estado: 'ACTIVO' },
      include: { producto: true },
    });
    if (protocolos.length === 0) return [];

    const ahora = new Date();
    const limite = new Date(ahora.getTime() + DIAS_ALERTA_PROXIMA * DIA_MS);
    const resultado: {
      id: string;
      tipo: 'PROTOCOLO';
      producto: (typeof protocolos)[number]['producto'];
      animal: { id: string; identificador: string };
      proximaFechaEsperada: Date;
      vencido: boolean;
    }[] = [];

    for (const protocolo of protocolos) {
      const animales = await this.prisma.animal.findMany({
        where: {
          tenantId,
          estado: 'ACTIVO',
          ...(protocolo.especie && { especie: protocolo.especie }),
          ...(protocolo.sexo && { sexo: protocolo.sexo }),
          ...(protocolo.categoria && { categoria: protocolo.categoria }),
        },
      });
      if (animales.length === 0) continue;

      const aplicaciones = await this.prisma.aplicacionSanitaria.findMany({
        where: {
          tenantId,
          productoId: protocolo.productoId,
          animalId: { in: animales.map((a) => a.id) },
        },
        orderBy: { fecha: 'desc' },
      });
      const ultimaPorAnimal = new Map<string, Date>();
      for (const ap of aplicaciones) {
        if (!ultimaPorAnimal.has(ap.animalId)) ultimaPorAnimal.set(ap.animalId, ap.fecha);
      }

      for (const animal of animales) {
        const ultima = ultimaPorAnimal.get(animal.id);
        let proximaFechaEsperada: Date | null = null;
        if (ultima && protocolo.frecuenciaDias) {
          proximaFechaEsperada = new Date(ultima.getTime() + protocolo.frecuenciaDias * DIA_MS);
        } else if (!ultima && protocolo.edadInicioDias !== null && animal.fechaNacimiento) {
          proximaFechaEsperada = new Date(animal.fechaNacimiento.getTime() + protocolo.edadInicioDias * DIA_MS);
        }
        if (!proximaFechaEsperada || proximaFechaEsperada > limite) continue;

        resultado.push({
          id: `protocolo:${protocolo.id}:${animal.id}`,
          tipo: 'PROTOCOLO',
          producto: protocolo.producto,
          animal: { id: animal.id, identificador: animal.identificador },
          proximaFechaEsperada,
          vencido: proximaFechaEsperada < ahora,
        });
      }
    }

    return resultado;
  }

  async alertas(tenantId: string) {
    const [refuerzos, protocolos] = await Promise.all([
      this.alertasRefuerzos(tenantId),
      this.protocolosPendientes(tenantId),
    ]);

    return [...refuerzos, ...protocolos].sort((a, b) => {
      const fa = a.proximaFechaEsperada?.getTime() ?? 0;
      const fb = b.proximaFechaEsperada?.getTime() ?? 0;
      return fa - fb;
    });
  }

  async cumplimiento(tenantId: string) {
    const ahora = new Date();
    const [vencidas, alDia] = await Promise.all([
      this.prisma.aplicacionSanitaria.count({
        where: { tenantId, proximaFechaEsperada: { not: null, lt: ahora } },
      }),
      this.prisma.aplicacionSanitaria.count({
        where: { tenantId, proximaFechaEsperada: { not: null, gte: ahora } },
      }),
    ]);
    const total = vencidas + alDia;
    return { total, vencidas, alDia, porcentajeAlDia: total > 0 ? (alDia / total) * 100 : 100 };
  }

  async crearDiagnostico(tenantId: string, dto: CrearDiagnosticoDto) {
    const animal = await this.prisma.animal.findFirst({ where: { id: dto.animalId, tenantId } });
    if (!animal) {
      throw new NotFoundException('Animal no encontrado.');
    }

    if (dto.tratamientoAplicacionId) {
      const tratamiento = await this.prisma.aplicacionSanitaria.findFirst({
        where: { id: dto.tratamientoAplicacionId, tenantId, animalId: dto.animalId },
      });
      if (!tratamiento) {
        throw new NotFoundException('La aplicación indicada como tratamiento no existe para este animal.');
      }
    }

    return this.prisma.diagnosticoSanitario.create({
      data: {
        tenantId,
        animalId: dto.animalId,
        fecha: new Date(dto.fecha),
        condicion: dto.condicion,
        gravedad: dto.gravedad,
        tratamientoAplicacionId: dto.tratamientoAplicacionId,
      },
      include: { tratamiento: { include: { producto: true } } },
    });
  }

  async historialDiagnosticos(tenantId: string, animalId: string) {
    const animal = await this.prisma.animal.findFirst({ where: { id: animalId, tenantId } });
    if (!animal) {
      throw new NotFoundException('Animal no encontrado.');
    }

    return this.prisma.diagnosticoSanitario.findMany({
      where: { tenantId, animalId },
      include: { tratamiento: { include: { producto: true } } },
      orderBy: { fecha: 'desc' },
    });
  }

  async iniciarCuarentena(tenantId: string, dto: CrearCuarentenaDto) {
    const animal = await this.prisma.animal.findFirst({ where: { id: dto.animalId, tenantId } });
    if (!animal) {
      throw new NotFoundException('Animal no encontrado.');
    }

    const activaExistente = await this.prisma.cuarentena.findFirst({
      where: { tenantId, animalId: dto.animalId, activa: true },
    });
    if (activaExistente) {
      throw new ConflictException({
        code: 'CUARENTENA_ACTIVA_EXISTENTE',
        message: 'Este animal ya tiene una cuarentena activa. Finalizala antes de iniciar una nueva.',
        cuarentenaId: activaExistente.id,
      });
    }

    return this.prisma.cuarentena.create({
      data: {
        tenantId,
        animalId: dto.animalId,
        fechaInicio: new Date(dto.fechaInicio),
        fechaFinEstimada: dto.fechaFinEstimada ? new Date(dto.fechaFinEstimada) : null,
        motivo: dto.motivo,
      },
    });
  }

  async finalizarCuarentena(tenantId: string, id: string, dto: FinalizarCuarentenaDto) {
    const cuarentena = await this.prisma.cuarentena.findFirst({ where: { id, tenantId } });
    if (!cuarentena) {
      throw new NotFoundException('Cuarentena no encontrada.');
    }

    return this.prisma.cuarentena.update({
      where: { id },
      data: { activa: false, fechaFinReal: dto.fecha ? new Date(dto.fecha) : new Date() },
    });
  }

  listarCuarentenas(tenantId: string, activas?: boolean, animalId?: string) {
    return this.prisma.cuarentena.findMany({
      where: {
        tenantId,
        ...(activas !== undefined && { activa: activas }),
        ...(animalId && { animalId }),
      },
      include: { animal: { select: { id: true, identificador: true } } },
      orderBy: { fechaInicio: 'desc' },
    });
  }
}
