import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ActualizarTrabajadorDto } from './dto/actualizar-trabajador.dto';
import { CrearAsignacionDto } from './dto/crear-asignacion.dto';
import { CrearAsistenciaDto } from './dto/crear-asistencia.dto';
import { CrearCargoDto } from './dto/crear-cargo.dto';
import { CrearTrabajadorDto } from './dto/crear-trabajador.dto';
import { FinalizarAsignacionDto } from './dto/finalizar-asignacion.dto';
import { ListarTrabajadoresQueryDto } from './dto/listar-trabajadores-query.dto';

function calcularHorasTrabajadas(horaEntrada: string | null, horaSalida: string | null): number | null {
  if (!horaEntrada || !horaSalida) return null;
  const [horaE, minE] = horaEntrada.split(':').map(Number);
  const [horaS, minS] = horaSalida.split(':').map(Number);
  const minutos = horaS * 60 + minS - (horaE * 60 + minE);
  return Math.round((minutos / 60) * 100) / 100;
}

// Antigüedad se calcula al leer, no se persiste (mismo criterio que
// categoria_etaria/GDP en otros módulos).
function calcularAntiguedad(fechaIngreso: Date): { anios: number; meses: number } {
  const ahora = new Date();
  let meses =
    (ahora.getUTCFullYear() - fechaIngreso.getUTCFullYear()) * 12 +
    (ahora.getUTCMonth() - fechaIngreso.getUTCMonth());
  if (ahora.getUTCDate() < fechaIngreso.getUTCDate()) {
    meses -= 1;
  }
  meses = Math.max(0, meses);
  return { anios: Math.floor(meses / 12), meses: meses % 12 };
}

@Injectable()
export class TrabajadoresService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Cargos (catálogo) ---------------------------------------------------

  async crearCargo(tenantId: string, dto: CrearCargoDto) {
    const existente = await this.prisma.cargo.findUnique({
      where: { tenantId_nombre: { tenantId, nombre: dto.nombre } },
    });
    if (existente) {
      throw new ConflictException({
        code: 'NOMBRE_DUPLICADO',
        message: `Ya existe un cargo con el nombre "${dto.nombre}" en este negocio.`,
      });
    }
    return this.prisma.cargo.create({ data: { tenantId, nombre: dto.nombre } });
  }

  listarCargos(tenantId: string) {
    return this.prisma.cargo.findMany({
      where: { tenantId, estado: 'ACTIVO' },
      orderBy: { nombre: 'asc' },
    });
  }

  private async obtenerCargo(tenantId: string, id: string) {
    const cargo = await this.prisma.cargo.findFirst({ where: { id, tenantId } });
    if (!cargo) {
      throw new NotFoundException('Cargo no encontrado.');
    }
    return cargo;
  }

  async activarCargo(tenantId: string, id: string) {
    await this.obtenerCargo(tenantId, id);
    return this.prisma.cargo.update({ where: { id }, data: { estado: 'ACTIVO' } });
  }

  async inactivarCargo(tenantId: string, id: string) {
    await this.obtenerCargo(tenantId, id);
    return this.prisma.cargo.update({ where: { id }, data: { estado: 'INACTIVO' } });
  }

  // --- Trabajadores ----------------------------------------------------------

  private async assertDocumentoDisponible(tenantId: string, documento: string, excluirId?: string) {
    const existente = await this.prisma.trabajador.findUnique({
      where: { tenantId_documento: { tenantId, documento } },
    });
    if (existente && existente.id !== excluirId) {
      throw new ConflictException({
        code: 'DOCUMENTO_DUPLICADO',
        message: `Ya existe un trabajador con el documento "${documento}" en este negocio.`,
      });
    }
  }

  private async assertCargoValido(tenantId: string, cargoId: string) {
    const cargo = await this.prisma.cargo.findFirst({ where: { id: cargoId, tenantId } });
    if (!cargo) {
      throw new NotFoundException('Cargo no encontrado.');
    }
    if (cargo.estado !== 'ACTIVO') {
      throw new BadRequestException('El cargo seleccionado está inactivo.');
    }
  }

  async crear(tenantId: string, dto: CrearTrabajadorDto) {
    await this.assertDocumentoDisponible(tenantId, dto.documento);
    await this.assertCargoValido(tenantId, dto.cargoId);

    return this.prisma.trabajador.create({
      data: {
        tenantId,
        nombres: dto.nombres,
        apellidos: dto.apellidos,
        documento: dto.documento,
        cargoId: dto.cargoId,
        fechaIngreso: new Date(dto.fechaIngreso),
        tipoContratacion: dto.tipoContratacion,
        modalidadPago: dto.modalidadPago,
        salarioOJornal: dto.salarioOJornal,
        fechaNacimiento: dto.fechaNacimiento ? new Date(dto.fechaNacimiento) : null,
        telefono: dto.telefono,
        email: dto.email,
        direccion: dto.direccion,
        contactoEmergenciaNombre: dto.contactoEmergenciaNombre,
        contactoEmergenciaTelefono: dto.contactoEmergenciaTelefono,
      },
      include: { cargo: true },
    });
  }

  async listar(tenantId: string, query: ListarTrabajadoresQueryDto) {
    const where: Prisma.TrabajadorWhereInput = {
      tenantId,
      ...(query.estado && { estado: query.estado }),
      ...(query.cargoId && { cargoId: query.cargoId }),
      ...(query.search && {
        OR: [
          { nombres: { contains: query.search, mode: 'insensitive' } },
          { apellidos: { contains: query.search, mode: 'insensitive' } },
          { documento: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.trabajador.findMany({
        where,
        include: { cargo: true },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.trabajador.count({ where }),
    ]);

    return { data, total, page: query.page, limit: query.limit };
  }

  async obtener(tenantId: string, id: string) {
    const trabajador = await this.prisma.trabajador.findFirst({
      where: { id, tenantId },
      include: { cargo: true },
    });
    if (!trabajador) {
      throw new NotFoundException('Trabajador no encontrado.');
    }
    return { ...trabajador, antiguedad: calcularAntiguedad(trabajador.fechaIngreso) };
  }

  async actualizar(tenantId: string, id: string, dto: ActualizarTrabajadorDto) {
    await this.obtenerSinAntiguedad(tenantId, id);

    if (dto.documento) {
      await this.assertDocumentoDisponible(tenantId, dto.documento, id);
    }
    if (dto.cargoId) {
      await this.assertCargoValido(tenantId, dto.cargoId);
    }

    return this.prisma.trabajador.update({
      where: { id },
      data: {
        nombres: dto.nombres,
        apellidos: dto.apellidos,
        documento: dto.documento,
        cargoId: dto.cargoId,
        fechaIngreso: dto.fechaIngreso ? new Date(dto.fechaIngreso) : undefined,
        tipoContratacion: dto.tipoContratacion,
        modalidadPago: dto.modalidadPago,
        salarioOJornal: dto.salarioOJornal,
        fechaNacimiento: dto.fechaNacimiento ? new Date(dto.fechaNacimiento) : undefined,
        telefono: dto.telefono,
        email: dto.email,
        direccion: dto.direccion,
        contactoEmergenciaNombre: dto.contactoEmergenciaNombre,
        contactoEmergenciaTelefono: dto.contactoEmergenciaTelefono,
      },
      include: { cargo: true },
    });
  }

  private async obtenerSinAntiguedad(tenantId: string, id: string) {
    const trabajador = await this.prisma.trabajador.findFirst({ where: { id, tenantId } });
    if (!trabajador) {
      throw new NotFoundException('Trabajador no encontrado.');
    }
    return trabajador;
  }

  async activar(tenantId: string, id: string) {
    await this.obtenerSinAntiguedad(tenantId, id);
    return this.prisma.trabajador.update({ where: { id }, data: { estado: 'ACTIVO' } });
  }

  async inactivar(tenantId: string, id: string) {
    await this.obtenerSinAntiguedad(tenantId, id);
    return this.prisma.trabajador.update({ where: { id }, data: { estado: 'INACTIVO' } });
  }

  // --- Asignaciones ----------------------------------------------------------
  // Mismo patrón que GanadoService.moverAnimales(): historial append-only
  // (asignaciones) + un puntero "actual" denormalizado (trabajador.cargoId),
  // actualizados atómicamente. A diferencia de Animal.potreroActualId, no se
  // agrega un campo "potrero actual" a Trabajador — la asignación a potrero
  // solo se consulta desde la propia ficha, no justifica la denormalización.

  async crearAsignacion(tenantId: string, trabajadorId: string, dto: CrearAsignacionDto) {
    const trabajador = await this.obtenerSinAntiguedad(tenantId, trabajadorId);
    if (trabajador.estado !== 'ACTIVO') {
      throw new BadRequestException('No se pueden crear asignaciones para un trabajador inactivo.');
    }
    if (!dto.cargoId && !dto.potreroId) {
      throw new BadRequestException('La asignación debe indicar al menos un cargo o un potrero.');
    }
    if (dto.cargoId) {
      await this.assertCargoValido(tenantId, dto.cargoId);
    }
    if (dto.potreroId) {
      const potrero = await this.prisma.potrero.findFirst({ where: { id: dto.potreroId, tenantId } });
      if (!potrero) {
        throw new NotFoundException('Potrero no encontrado.');
      }
      if (potrero.estado !== 'ACTIVO') {
        throw new BadRequestException('El potrero seleccionado está inactivo.');
      }
    }

    const fechaInicio = new Date(dto.fechaInicio);
    const abierta = await this.prisma.asignacion.findFirst({
      where: { tenantId, trabajadorId, fechaFin: null },
    });

    const nueva = await this.prisma.$transaction(async (tx) => {
      if (abierta) {
        await tx.asignacion.update({ where: { id: abierta.id }, data: { fechaFin: fechaInicio } });
      }
      const creada = await tx.asignacion.create({
        data: {
          tenantId,
          trabajadorId,
          cargoId: dto.cargoId,
          potreroId: dto.potreroId,
          fechaInicio,
          fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : null,
          observaciones: dto.observaciones,
        },
        include: { cargo: true, potrero: true },
      });
      if (dto.cargoId) {
        await tx.trabajador.update({ where: { id: trabajadorId }, data: { cargoId: dto.cargoId } });
      }
      return creada;
    });

    return { ...nueva, estado: nueva.fechaFin ? 'FINALIZADA' : 'VIGENTE' };
  }

  async finalizarAsignacion(tenantId: string, id: string, dto: FinalizarAsignacionDto) {
    const asignacion = await this.prisma.asignacion.findFirst({ where: { id, tenantId } });
    if (!asignacion) {
      throw new NotFoundException('Asignación no encontrada.');
    }
    if (asignacion.fechaFin) {
      throw new BadRequestException('La asignación ya está finalizada.');
    }
    return this.prisma.asignacion.update({
      where: { id },
      data: { fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : new Date() },
      include: { cargo: true, potrero: true },
    });
  }

  async listarAsignaciones(tenantId: string, trabajadorId: string) {
    await this.obtenerSinAntiguedad(tenantId, trabajadorId);
    const asignaciones = await this.prisma.asignacion.findMany({
      where: { tenantId, trabajadorId },
      include: { cargo: true, potrero: true },
      orderBy: { fechaInicio: 'desc' },
    });
    return asignaciones.map((a) => ({ ...a, estado: a.fechaFin ? 'FINALIZADA' : 'VIGENTE' }));
  }

  // --- Asistencia --------------------------------------------------------

  async crearAsistencia(tenantId: string, trabajadorId: string, dto: CrearAsistenciaDto, usuarioId: string) {
    const trabajador = await this.obtenerSinAntiguedad(tenantId, trabajadorId);
    if (trabajador.estado !== 'ACTIVO') {
      throw new BadRequestException('No se puede registrar asistencia de un trabajador inactivo.');
    }

    const fecha = new Date(dto.fecha);
    const ahora = new Date();
    const hoyUtc = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate()));
    if (fecha > hoyUtc) {
      throw new BadRequestException('No se puede registrar asistencia con fecha futura.');
    }

    if (dto.horaEntrada && dto.horaSalida && dto.horaSalida < dto.horaEntrada) {
      throw new BadRequestException('La hora de salida no puede ser anterior a la hora de entrada.');
    }

    const existente = await this.prisma.asistencia.findUnique({
      where: { tenantId_trabajadorId_fecha: { tenantId, trabajadorId, fecha } },
    });

    const data = {
      estado: dto.estado,
      horaEntrada: dto.horaEntrada,
      horaSalida: dto.horaSalida,
      tipoJornada: dto.tipoJornada,
      jornalRealizado: dto.jornalRealizado,
      observaciones: dto.observaciones,
    };

    let asistencia;
    if (existente) {
      if (!dto.confirmar) {
        throw new ConflictException({
          code: 'ASISTENCIA_DUPLICADA',
          message:
            'Ya existe un registro de asistencia para este trabajador en esta fecha. Confirmá si querés reemplazarlo.',
        });
      }
      asistencia = await this.prisma.asistencia.update({ where: { id: existente.id }, data });
    } else {
      asistencia = await this.prisma.asistencia.create({
        data: { tenantId, trabajadorId, fecha, registradoPorId: usuarioId, ...data },
      });
    }

    return { ...asistencia, horasTrabajadas: calcularHorasTrabajadas(asistencia.horaEntrada, asistencia.horaSalida) };
  }

  async listarAsistencias(tenantId: string, trabajadorId: string) {
    await this.obtenerSinAntiguedad(tenantId, trabajadorId);
    const asistencias = await this.prisma.asistencia.findMany({
      where: { tenantId, trabajadorId },
      orderBy: { fecha: 'desc' },
    });
    return asistencias.map((a) => ({ ...a, horasTrabajadas: calcularHorasTrabajadas(a.horaEntrada, a.horaSalida) }));
  }

  async listarAsistenciaDelDia(tenantId: string, fechaStr: string) {
    const fecha = new Date(fechaStr);
    const [trabajadores, asistencias] = await Promise.all([
      this.prisma.trabajador.findMany({
        where: { tenantId, estado: 'ACTIVO' },
        include: { cargo: true },
        orderBy: { nombres: 'asc' },
      }),
      this.prisma.asistencia.findMany({ where: { tenantId, fecha } }),
    ]);

    const porTrabajador = new Map(asistencias.map((a) => [a.trabajadorId, a]));
    return trabajadores.map((t) => {
      const asistencia = porTrabajador.get(t.id);
      return {
        trabajador: t,
        asistencia: asistencia
          ? { ...asistencia, horasTrabajadas: calcularHorasTrabajadas(asistencia.horaEntrada, asistencia.horaSalida) }
          : null,
      };
    });
  }
}
