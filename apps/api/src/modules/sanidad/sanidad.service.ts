import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearAplicacionDto } from './dto/crear-aplicacion.dto';
import { CrearProductoSanitarioDto } from './dto/crear-producto-sanitario.dto';

const DIAS_ALERTA_PROXIMA = 7;

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

  listar(tenantId: string) {
    return this.prisma.aplicacionSanitaria.findMany({
      where: { tenantId },
      include: { producto: true, animal: true, responsable: RESPONSABLE_SELECT },
      orderBy: { fecha: 'desc' },
      take: 50,
    });
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

  async alertas(tenantId: string) {
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
      vencido: a.proximaFechaEsperada !== null && a.proximaFechaEsperada < ahora,
    }));
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
}
