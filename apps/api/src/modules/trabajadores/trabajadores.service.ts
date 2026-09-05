import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { MonedaTrabajador, Prisma } from '@prisma/client';
import { ExportService } from '../reportes/export.service';
import { DatosReporte } from '../reportes/reportes.types';
import { PrismaService } from '../../prisma/prisma.service';
import { ActualizarTrabajadorDto } from './dto/actualizar-trabajador.dto';
import { ConfirmarPagoDto } from './dto/confirmar-pago.dto';
import { CrearAbonoPrestamoDto } from './dto/crear-abono-prestamo.dto';
import { CrearAdelantoDto } from './dto/crear-adelanto.dto';
import { CrearAsignacionDto } from './dto/crear-asignacion.dto';
import { CrearAsistenciaDto } from './dto/crear-asistencia.dto';
import { CrearCargoDto } from './dto/crear-cargo.dto';
import { CrearPrestamoDto } from './dto/crear-prestamo.dto';
import { CrearTrabajadorDto } from './dto/crear-trabajador.dto';
import { ExportarReporteTrabajadorDto, FormatoReporteTrabajador } from './dto/exportar-reporte-trabajador.dto';
import { FiltrosReporteTrabajadorDto } from './dto/filtros-reporte-trabajador.dto';
import { FinalizarAsignacionDto } from './dto/finalizar-asignacion.dto';
import { ListarTrabajadoresQueryDto } from './dto/listar-trabajadores-query.dto';
import { PrevisualizarPagoDto } from './dto/previsualizar-pago.dto';

function calcularHorasTrabajadas(horaEntrada: string | null, horaSalida: string | null): number | null {
  if (!horaEntrada || !horaSalida) return null;
  const [horaE, minE] = horaEntrada.split(':').map(Number);
  const [horaS, minS] = horaSalida.split(':').map(Number);
  const minutos = horaS * 60 + minS - (horaE * 60 + minE);
  return Math.round((minutos / 60) * 100) / 100;
}

// USD es la moneda de referencia fija (v1, no configurable por negocio — ver
// design.md Etapa 4). En USD no hace falta tasa; en VES es obligatoria y se
// congela junto con el equivalente, sin recalcularse nunca retroactivamente.
function calcularEquivalenteUsd(
  moneda: MonedaTrabajador,
  monto: number,
  tasaCambio?: number,
): { tasaCambio: number | null; montoEquivalenteUsd: number | null } {
  if (moneda === 'USD') {
    return { tasaCambio: null, montoEquivalenteUsd: null };
  }
  if (!tasaCambio) {
    throw new BadRequestException('Se requiere la tasa de cambio para operaciones en VES.');
  }
  return { tasaCambio, montoEquivalenteUsd: Math.round((monto / tasaCambio) * 100) / 100 };
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

const NOMBRES_MES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function claveMes(fecha: Date): string {
  return `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, '0')}`;
}

function etiquetaMes(clave: string): string {
  const [anio, mes] = clave.split('-');
  return `${NOMBRES_MES[Number(mes) - 1]} ${anio}`;
}

function mesesEnRango(desde: Date, hasta: Date): string[] {
  const claves: string[] = [];
  const cursor = new Date(Date.UTC(desde.getUTCFullYear(), desde.getUTCMonth(), 1));
  const limite = new Date(Date.UTC(hasta.getUTCFullYear(), hasta.getUTCMonth(), 1));
  while (cursor <= limite) {
    claves.push(claveMes(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return claves;
}

// Reportes de trabajadores/asistencia/pagos no definen un período por
// defecto en el spec — se usa una ventana de 30 días (grano diario, a
// diferencia de los 6 meses por defecto de `reportes.service.ts`, pensados
// para series mensuales).
function resolverRangoTrabajador(filtros: FiltrosReporteTrabajadorDto): { desde: Date; hasta: Date } {
  const hasta = filtros.hasta ? new Date(filtros.hasta) : new Date();
  const desde = filtros.desde ? new Date(filtros.desde) : new Date(hasta.getTime() - 29 * 24 * 60 * 60 * 1000);
  return { desde, hasta };
}

function montoPagoEnUsd(
  moneda: MonedaTrabajador,
  montoTotal: Prisma.Decimal | number | string,
  montoEquivalenteUsd: Prisma.Decimal | number | string | null,
): number {
  return moneda === 'USD' ? Number(montoTotal) : Number(montoEquivalenteUsd ?? 0);
}

@Injectable()
export class TrabajadoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly exportService: ExportService,
  ) {}

  // No se construye un sistema de auditoría genérico — es específico de este
  // módulo (no existe uno general hoy en la plataforma). Cada mutación
  // crítica escribe su fila dentro de la misma transacción.
  private registrarHistorial(
    tx: Prisma.TransactionClient,
    tenantId: string,
    trabajadorId: string,
    tipo: string,
    descripcion: string,
    usuarioId: string,
    data?: unknown,
  ) {
    return tx.historialTrabajador.create({
      data: { tenantId, trabajadorId, tipo, descripcion, usuarioId, data: data as Prisma.InputJsonValue },
    });
  }

  async listarHistorial(tenantId: string, trabajadorId: string) {
    await this.obtenerSinAntiguedad(tenantId, trabajadorId);
    return this.prisma.historialTrabajador.findMany({
      where: { tenantId, trabajadorId },
      orderBy: { createdAt: 'desc' },
    });
  }

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

  async crear(tenantId: string, dto: CrearTrabajadorDto, usuarioId: string) {
    await this.assertDocumentoDisponible(tenantId, dto.documento);
    await this.assertCargoValido(tenantId, dto.cargoId);

    return this.prisma.$transaction(async (tx) => {
      const trabajador = await tx.trabajador.create({
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
      await this.registrarHistorial(tx, tenantId, trabajador.id, 'alta', 'Alta del trabajador', usuarioId);
      return trabajador;
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

  async actualizar(tenantId: string, id: string, dto: ActualizarTrabajadorDto, usuarioId: string) {
    await this.obtenerSinAntiguedad(tenantId, id);

    if (dto.documento) {
      await this.assertDocumentoDisponible(tenantId, dto.documento, id);
    }
    if (dto.cargoId) {
      await this.assertCargoValido(tenantId, dto.cargoId);
    }

    return this.prisma.$transaction(async (tx) => {
      const trabajador = await tx.trabajador.update({
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
      await this.registrarHistorial(tx, tenantId, id, 'edicion', 'Edición de datos del trabajador', usuarioId, dto);
      return trabajador;
    });
  }

  private async obtenerSinAntiguedad(tenantId: string, id: string) {
    const trabajador = await this.prisma.trabajador.findFirst({ where: { id, tenantId } });
    if (!trabajador) {
      throw new NotFoundException('Trabajador no encontrado.');
    }
    return trabajador;
  }

  async activar(tenantId: string, id: string, usuarioId: string) {
    await this.obtenerSinAntiguedad(tenantId, id);
    return this.prisma.$transaction(async (tx) => {
      const trabajador = await tx.trabajador.update({ where: { id }, data: { estado: 'ACTIVO' } });
      await this.registrarHistorial(tx, tenantId, id, 'cambio_estado', 'Cambio de estado a ACTIVO', usuarioId);
      return trabajador;
    });
  }

  async inactivar(tenantId: string, id: string, usuarioId: string) {
    await this.obtenerSinAntiguedad(tenantId, id);
    return this.prisma.$transaction(async (tx) => {
      const trabajador = await tx.trabajador.update({ where: { id }, data: { estado: 'INACTIVO' } });
      await this.registrarHistorial(tx, tenantId, id, 'cambio_estado', 'Cambio de estado a INACTIVO', usuarioId);
      return trabajador;
    });
  }

  // --- Asignaciones ----------------------------------------------------------
  // Mismo patrón que GanadoService.moverAnimales(): historial append-only
  // (asignaciones) + un puntero "actual" denormalizado (trabajador.cargoId),
  // actualizados atómicamente. A diferencia de Animal.potreroActualId, no se
  // agrega un campo "potrero actual" a Trabajador — la asignación a potrero
  // solo se consulta desde la propia ficha, no justifica la denormalización.

  async crearAsignacion(tenantId: string, trabajadorId: string, dto: CrearAsignacionDto, usuarioId: string) {
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
      const partes: string[] = [];
      if (creada.cargo) partes.push(`cargo "${creada.cargo.nombre}"`);
      if (creada.potrero) partes.push(`potrero "${creada.potrero.nombre}"`);
      await this.registrarHistorial(
        tx,
        tenantId,
        trabajadorId,
        'asignacion',
        `Nueva asignación (${partes.join(', ')})`,
        usuarioId,
      );
      return creada;
    });

    return { ...nueva, estado: nueva.fechaFin ? 'FINALIZADA' : 'VIGENTE' };
  }

  async finalizarAsignacion(tenantId: string, id: string, dto: FinalizarAsignacionDto, usuarioId: string) {
    const asignacion = await this.prisma.asignacion.findFirst({ where: { id, tenantId } });
    if (!asignacion) {
      throw new NotFoundException('Asignación no encontrada.');
    }
    if (asignacion.fechaFin) {
      throw new BadRequestException('La asignación ya está finalizada.');
    }
    return this.prisma.$transaction(async (tx) => {
      const actualizada = await tx.asignacion.update({
        where: { id },
        data: { fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : new Date() },
        include: { cargo: true, potrero: true },
      });
      await this.registrarHistorial(
        tx,
        tenantId,
        asignacion.trabajadorId,
        'asignacion',
        'Asignación finalizada',
        usuarioId,
      );
      return actualizada;
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

  // --- Adelantos -----------------------------------------------------------

  async crearAdelanto(tenantId: string, trabajadorId: string, dto: CrearAdelantoDto, usuarioId: string) {
    const trabajador = await this.obtenerSinAntiguedad(tenantId, trabajadorId);
    if (trabajador.estado !== 'ACTIVO') {
      throw new BadRequestException('No se puede registrar un adelanto para un trabajador inactivo.');
    }
    const { tasaCambio, montoEquivalenteUsd } = calcularEquivalenteUsd(dto.moneda, dto.monto, dto.tasaCambio);

    return this.prisma.$transaction(async (tx) => {
      const adelanto = await tx.adelanto.create({
        data: {
          tenantId,
          trabajadorId,
          fecha: new Date(dto.fecha),
          monto: dto.monto,
          moneda: dto.moneda,
          tasaCambio,
          montoEquivalenteUsd,
          motivo: dto.motivo,
          metodoEntrega: dto.metodoEntrega,
          observaciones: dto.observaciones,
          registradoPorId: usuarioId,
        },
      });
      await this.registrarHistorial(
        tx,
        tenantId,
        trabajadorId,
        'adelanto',
        `Adelanto otorgado: ${dto.monto} ${dto.moneda}`,
        usuarioId,
      );
      return adelanto;
    });
  }

  async listarAdelantos(tenantId: string, trabajadorId: string) {
    await this.obtenerSinAntiguedad(tenantId, trabajadorId);
    const adelantos = await this.prisma.adelanto.findMany({
      where: { tenantId, trabajadorId },
      orderBy: { fecha: 'desc' },
    });
    return adelantos.map((a) => ({ ...a, saldoPendiente: Number(a.monto) - Number(a.montoDescontado) }));
  }

  // --- Préstamos -------------------------------------------------------------

  async crearPrestamo(tenantId: string, trabajadorId: string, dto: CrearPrestamoDto, usuarioId: string) {
    const trabajador = await this.obtenerSinAntiguedad(tenantId, trabajadorId);
    if (trabajador.estado !== 'ACTIVO') {
      throw new BadRequestException('No se puede registrar un préstamo para un trabajador inactivo.');
    }
    const { tasaCambio, montoEquivalenteUsd } = calcularEquivalenteUsd(dto.moneda, dto.montoOriginal, dto.tasaCambio);

    return this.prisma.$transaction(async (tx) => {
      const prestamo = await tx.prestamo.create({
        data: {
          tenantId,
          trabajadorId,
          fecha: new Date(dto.fecha),
          montoOriginal: dto.montoOriginal,
          moneda: dto.moneda,
          tasaCambio,
          montoEquivalenteUsd,
          numeroCuotas: dto.numeroCuotas,
          valorCuota: dto.valorCuota,
          fechaInicio: new Date(dto.fechaInicio),
          observaciones: dto.observaciones,
          registradoPorId: usuarioId,
        },
      });
      await this.registrarHistorial(
        tx,
        tenantId,
        trabajadorId,
        'prestamo',
        `Préstamo otorgado: ${dto.montoOriginal} ${dto.moneda} en ${dto.numeroCuotas} cuotas`,
        usuarioId,
      );
      return prestamo;
    });
  }

  async crearAbonoPrestamo(tenantId: string, prestamoId: string, dto: CrearAbonoPrestamoDto) {
    const prestamo = await this.prisma.prestamo.findFirst({
      where: { id: prestamoId, tenantId },
      include: { abonos: true },
    });
    if (!prestamo) {
      throw new NotFoundException('Préstamo no encontrado.');
    }

    const totalPagado = prestamo.abonos.reduce((acc, a) => acc + Number(a.monto), 0);
    const saldoPendiente = Number(prestamo.montoOriginal) - totalPagado;
    if (dto.monto > saldoPendiente) {
      throw new BadRequestException({
        code: 'MONTO_EXCEDE_SALDO',
        message: `El abono ($${dto.monto}) supera el saldo pendiente ($${saldoPendiente.toFixed(2)}).`,
      });
    }

    return this.prisma.prestamoAbono.create({
      data: { prestamoId, fecha: new Date(dto.fecha), monto: dto.monto, observaciones: dto.observaciones },
    });
  }

  async listarPrestamos(tenantId: string, trabajadorId: string) {
    await this.obtenerSinAntiguedad(tenantId, trabajadorId);
    const prestamos = await this.prisma.prestamo.findMany({
      where: { tenantId, trabajadorId },
      include: { abonos: { orderBy: { fecha: 'desc' } } },
      orderBy: { fecha: 'desc' },
    });
    return prestamos.map((p) => {
      const totalPagado = p.abonos.reduce((acc, a) => acc + Number(a.monto), 0);
      const saldoPendiente = Number(p.montoOriginal) - totalPagado;
      const cuotasPagadas = Math.floor(totalPagado / Number(p.valorCuota));
      return { ...p, totalPagado, saldoPendiente, cuotasPagadas };
    });
  }

  // --- Pagos -----------------------------------------------------------------

  async previsualizarPago(tenantId: string, trabajadorId: string, dto: PrevisualizarPagoDto) {
    const trabajador = await this.obtenerSinAntiguedad(tenantId, trabajadorId);
    const periodoDesde = new Date(dto.periodoDesde);
    const periodoHasta = new Date(dto.periodoHasta);

    const asistencias = await this.prisma.asistencia.findMany({
      where: { tenantId, trabajadorId, fecha: { gte: periodoDesde, lte: periodoHasta } },
    });

    const jornadas = asistencias.filter((a) => a.estado === 'PRESENTE').length;
    const horasTrabajadas = asistencias.reduce(
      (acc, a) => acc + (calcularHorasTrabajadas(a.horaEntrada, a.horaSalida) ?? 0),
      0,
    );
    const jornalesRealizados = asistencias.reduce((acc, a) => acc + Number(a.jornalRealizado ?? 0), 0);

    // Solo JORNAL/SALARIO tienen una fórmula clara a partir de datos ya
    // existentes; el resto (POR_ACTIVIDAD, BONO, COMISION, OTRO) se ingresa a
    // mano — ver Contexto en el plan de la Etapa 5.
    let montoBaseSugerido = 0;
    if (dto.tipo === 'JORNAL') {
      montoBaseSugerido = jornalesRealizados * Number(trabajador.salarioOJornal);
    } else if (dto.tipo === 'SALARIO') {
      montoBaseSugerido = Number(trabajador.salarioOJornal);
    }

    const [adelantos, prestamos] = await Promise.all([
      this.listarAdelantos(tenantId, trabajadorId),
      this.listarPrestamos(tenantId, trabajadorId),
    ]);

    return {
      jornadas,
      horasTrabajadas: Math.round(horasTrabajadas * 100) / 100,
      jornalesRealizados,
      montoBaseSugerido,
      adelantosPendientes: adelantos.filter((a) => a.saldoPendiente > 0),
      prestamosPendientes: prestamos.filter((p) => p.saldoPendiente > 0),
    };
  }

  async confirmarPago(tenantId: string, trabajadorId: string, dto: ConfirmarPagoDto, usuarioId: string) {
    const trabajador = await this.obtenerSinAntiguedad(tenantId, trabajadorId);
    if (trabajador.estado !== 'ACTIVO' && !dto.confirmar) {
      throw new ConflictException({
        code: 'TRABAJADOR_INACTIVO',
        message: 'El trabajador está inactivo. Confirmá si igual querés registrar el pago.',
      });
    }

    const adelantosValidados: { adelantoId: string; monto: number }[] = [];
    for (const item of dto.adelantos ?? []) {
      const adelanto = await this.prisma.adelanto.findFirst({
        where: { id: item.adelantoId, tenantId, trabajadorId },
      });
      if (!adelanto) {
        throw new NotFoundException('Adelanto no encontrado.');
      }
      const saldoPendiente = Number(adelanto.monto) - Number(adelanto.montoDescontado);
      if (item.monto > saldoPendiente) {
        throw new BadRequestException({
          code: 'MONTO_EXCEDE_SALDO',
          message: `El descuento del adelanto ($${item.monto}) supera su saldo pendiente ($${saldoPendiente.toFixed(2)}).`,
        });
      }
      adelantosValidados.push({ adelantoId: item.adelantoId, monto: item.monto });
    }

    const prestamosValidados: { prestamoId: string; monto: number }[] = [];
    for (const item of dto.prestamos ?? []) {
      const prestamo = await this.prisma.prestamo.findFirst({
        where: { id: item.prestamoId, tenantId, trabajadorId },
        include: { abonos: true },
      });
      if (!prestamo) {
        throw new NotFoundException('Préstamo no encontrado.');
      }
      const totalPagado = prestamo.abonos.reduce((acc, a) => acc + Number(a.monto), 0);
      const saldoPendiente = Number(prestamo.montoOriginal) - totalPagado;
      if (item.monto > saldoPendiente) {
        throw new BadRequestException({
          code: 'MONTO_EXCEDE_SALDO',
          message: `El descuento del préstamo ($${item.monto}) supera su saldo pendiente ($${saldoPendiente.toFixed(2)}).`,
        });
      }
      prestamosValidados.push({ prestamoId: item.prestamoId, monto: item.monto });
    }

    const bonificaciones = dto.bonificaciones ?? 0;
    const otrosDescuentos = dto.otrosDescuentos ?? 0;
    const adelantosDescontados = adelantosValidados.reduce((acc, a) => acc + a.monto, 0);
    const prestamosDescontados = prestamosValidados.reduce((acc, p) => acc + p.monto, 0);
    const montoTotal = dto.montoBase + bonificaciones - adelantosDescontados - prestamosDescontados - otrosDescuentos;

    const { tasaCambio, montoEquivalenteUsd } = calcularEquivalenteUsd(dto.moneda, montoTotal, dto.tasaCambio);
    const fecha = new Date(dto.fecha);

    return this.prisma.$transaction(async (tx) => {
      const pago = await tx.pago.create({
        data: {
          tenantId,
          trabajadorId,
          tipo: dto.tipo,
          periodoDesde: new Date(dto.periodoDesde),
          periodoHasta: new Date(dto.periodoHasta),
          montoBase: dto.montoBase,
          bonificaciones,
          adelantosDescontados,
          prestamosDescontados,
          otrosDescuentos,
          montoTotal,
          moneda: dto.moneda,
          tasaCambio,
          montoEquivalenteUsd,
          detalleJson: { adelantos: adelantosValidados, prestamos: prestamosValidados },
          fecha,
          observaciones: dto.observaciones,
          confirmadoPorId: usuarioId,
        },
      });

      for (const item of adelantosValidados) {
        await tx.adelanto.update({
          where: { id: item.adelantoId },
          data: { montoDescontado: { increment: item.monto } },
        });
      }
      for (const item of prestamosValidados) {
        await tx.prestamoAbono.create({
          data: { prestamoId: item.prestamoId, fecha, monto: item.monto, pagoId: pago.id },
        });
      }

      await this.registrarHistorial(
        tx,
        tenantId,
        trabajadorId,
        'pago',
        `Pago confirmado: ${montoTotal.toFixed(2)} ${dto.moneda} (${dto.tipo})`,
        usuarioId,
      );

      return pago;
    });
  }

  async listarPagos(tenantId: string, trabajadorId: string) {
    await this.obtenerSinAntiguedad(tenantId, trabajadorId);
    return this.prisma.pago.findMany({
      where: { tenantId, trabajadorId },
      orderBy: { fecha: 'desc' },
    });
  }

  // --- Reportes ----------------------------------------------------------

  private async reporteTrabajadores(tenantId: string): Promise<DatosReporte> {
    const trabajadores = await this.prisma.trabajador.findMany({
      where: { tenantId },
      include: { cargo: true },
    });

    const activos = trabajadores.filter((t) => t.estado === 'ACTIVO').length;
    const inactivos = trabajadores.length - activos;

    const porCargo = new Map<string, { activos: number; inactivos: number }>();
    for (const t of trabajadores) {
      const entry = porCargo.get(t.cargo.nombre) ?? { activos: 0, inactivos: 0 };
      if (t.estado === 'ACTIVO') entry.activos += 1;
      else entry.inactivos += 1;
      porCargo.set(t.cargo.nombre, entry);
    }

    return {
      tipo: 'trabajadores',
      generadoEn: new Date().toISOString(),
      filtros: {},
      resumen: { Activos: activos, Inactivos: inactivos, Total: trabajadores.length },
      tablas: [
        {
          titulo: 'Por cargo',
          columnas: ['Cargo', 'Activos', 'Inactivos', 'Total'],
          filas: Array.from(porCargo.entries()).map(([cargo, e]) => [cargo, e.activos, e.inactivos, e.activos + e.inactivos]),
        },
      ],
    };
  }

  private async reporteAsistencia(tenantId: string, filtrosDto: FiltrosReporteTrabajadorDto): Promise<DatosReporte> {
    const { desde, hasta } = resolverRangoTrabajador(filtrosDto);
    const asistencias = await this.prisma.asistencia.findMany({
      where: { tenantId, fecha: { gte: desde, lte: hasta } },
      include: { trabajador: { select: { nombres: true, apellidos: true } } },
    });

    const conteoPorEstado: Record<string, number> = {
      PRESENTE: 0,
      AUSENTE: 0,
      PERMISO: 0,
      VACACIONES: 0,
      FALTA_JUSTIFICADA: 0,
      FALTA_INJUSTIFICADA: 0,
    };
    let horasTotales = 0;
    const porTrabajador = new Map<string, { jornadas: number; horas: number; ausencias: number }>();

    for (const a of asistencias) {
      conteoPorEstado[a.estado] = (conteoPorEstado[a.estado] ?? 0) + 1;
      const horas = calcularHorasTrabajadas(a.horaEntrada, a.horaSalida) ?? 0;
      horasTotales += horas;
      const nombre = `${a.trabajador.nombres} ${a.trabajador.apellidos}`;
      const entry = porTrabajador.get(nombre) ?? { jornadas: 0, horas: 0, ausencias: 0 };
      if (a.estado === 'PRESENTE') entry.jornadas += 1;
      if (a.estado === 'AUSENTE') entry.ausencias += 1;
      entry.horas += horas;
      porTrabajador.set(nombre, entry);
    }

    return {
      tipo: 'asistencia',
      generadoEn: new Date().toISOString(),
      filtros: { desde: desde.toISOString(), hasta: hasta.toISOString() },
      resumen: {
        Jornadas: conteoPorEstado.PRESENTE,
        'Horas trabajadas': Math.round(horasTotales * 100) / 100,
        Ausencias: conteoPorEstado.AUSENTE,
        Permisos: conteoPorEstado.PERMISO,
        Vacaciones: conteoPorEstado.VACACIONES,
        'Faltas justificadas': conteoPorEstado.FALTA_JUSTIFICADA,
        'Faltas injustificadas': conteoPorEstado.FALTA_INJUSTIFICADA,
      },
      tablas: [
        {
          titulo: 'Por trabajador',
          columnas: ['Trabajador', 'Jornadas', 'Horas', 'Ausencias'],
          filas: Array.from(porTrabajador.entries()).map(([nombre, e]) => [
            nombre,
            e.jornadas,
            Math.round(e.horas * 100) / 100,
            e.ausencias,
          ]),
        },
      ],
    };
  }

  private async reportePagos(tenantId: string, filtrosDto: FiltrosReporteTrabajadorDto): Promise<DatosReporte> {
    const { desde, hasta } = resolverRangoTrabajador(filtrosDto);
    const pagos = await this.prisma.pago.findMany({
      where: { tenantId, fecha: { gte: desde, lte: hasta } },
      include: { trabajador: { select: { nombres: true, apellidos: true } } },
    });

    let totalUsd = 0;
    const porTrabajador = new Map<string, number>();
    const porConcepto = new Map<string, number>();

    for (const p of pagos) {
      const monto = montoPagoEnUsd(p.moneda, p.montoTotal, p.montoEquivalenteUsd);
      totalUsd += monto;
      const nombre = `${p.trabajador.nombres} ${p.trabajador.apellidos}`;
      porTrabajador.set(nombre, (porTrabajador.get(nombre) ?? 0) + monto);
      porConcepto.set(p.tipo, (porConcepto.get(p.tipo) ?? 0) + monto);
    }

    return {
      tipo: 'pagos',
      generadoEn: new Date().toISOString(),
      filtros: { desde: desde.toISOString(), hasta: hasta.toISOString() },
      resumen: { 'Total pagado (USD equiv.)': Number(totalUsd.toFixed(2)), 'Cantidad de pagos': pagos.length },
      tablas: [
        {
          titulo: 'Por trabajador',
          columnas: ['Trabajador', 'Total (USD equiv.)'],
          filas: Array.from(porTrabajador.entries()).map(([nombre, monto]) => [nombre, Number(monto.toFixed(2))]),
        },
        {
          titulo: 'Por concepto',
          columnas: ['Tipo', 'Total (USD equiv.)'],
          filas: Array.from(porConcepto.entries()).map(([tipo, monto]) => [tipo, Number(monto.toFixed(2))]),
        },
      ],
    };
  }

  private async reporteCostoLaboral(tenantId: string, filtrosDto: FiltrosReporteTrabajadorDto): Promise<DatosReporte> {
    const { desde, hasta } = resolverRangoTrabajador(filtrosDto);
    const [trabajadoresActivos, asistencias, pagos] = await Promise.all([
      this.prisma.trabajador.count({ where: { tenantId, estado: 'ACTIVO' } }),
      this.prisma.asistencia.findMany({ where: { tenantId, fecha: { gte: desde, lte: hasta } } }),
      this.prisma.pago.findMany({ where: { tenantId, fecha: { gte: desde, lte: hasta } } }),
    ]);

    const jornadas = asistencias.filter((a) => a.estado === 'PRESENTE').length;
    const jornalesRealizados = asistencias.reduce((acc, a) => acc + Number(a.jornalRealizado ?? 0), 0);

    let totalSalarios = 0;
    let totalBonos = 0;
    let totalOtros = 0;
    const claves = mesesEnRango(desde, hasta);
    const porMes = new Map(claves.map((c) => [c, 0]));

    for (const p of pagos) {
      const monto = montoPagoEnUsd(p.moneda, p.montoTotal, p.montoEquivalenteUsd);
      if (p.tipo === 'SALARIO' || p.tipo === 'JORNAL') totalSalarios += monto;
      else if (p.tipo === 'BONO' || p.tipo === 'COMISION') totalBonos += monto;
      else totalOtros += monto;
      const clave = claveMes(p.fecha);
      porMes.set(clave, (porMes.get(clave) ?? 0) + monto);
    }

    const costoTotal = totalSalarios + totalBonos + totalOtros;

    return {
      tipo: 'costo-laboral',
      generadoEn: new Date().toISOString(),
      filtros: { desde: desde.toISOString(), hasta: hasta.toISOString() },
      resumen: {
        'Trabajadores activos': trabajadoresActivos,
        'Jornadas del período': jornadas,
        'Jornales realizados': jornalesRealizados,
        'Total salarios (USD equiv.)': Number(totalSalarios.toFixed(2)),
        'Total bonos (USD equiv.)': Number(totalBonos.toFixed(2)),
        'Otros pagos (USD equiv.)': Number(totalOtros.toFixed(2)),
        'Costo laboral total (USD equiv.)': Number(costoTotal.toFixed(2)),
      },
      tablas: [
        {
          titulo: 'Por mes',
          columnas: ['Mes', 'Costo (USD equiv.)'],
          filas: claves.map((c) => [etiquetaMes(c), Number((porMes.get(c) ?? 0).toFixed(2))]),
        },
      ],
    };
  }

  async obtenerReporte(tenantId: string, tipo: string, filtros: FiltrosReporteTrabajadorDto): Promise<DatosReporte> {
    switch (tipo) {
      case 'trabajadores':
        return this.reporteTrabajadores(tenantId);
      case 'asistencia':
        return this.reporteAsistencia(tenantId, filtros);
      case 'pagos':
        return this.reportePagos(tenantId, filtros);
      case 'costo-laboral':
        return this.reporteCostoLaboral(tenantId, filtros);
      default:
        throw new BadRequestException(`Tipo de reporte no soportado: ${tipo}`);
    }
  }

  async exportarReporte(
    tenantId: string,
    tipo: string,
    dto: ExportarReporteTrabajadorDto,
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const datos = await this.obtenerReporte(tenantId, tipo, dto);
    const fecha = new Date().toISOString().slice(0, 10);
    const formato: FormatoReporteTrabajador = dto.formato;

    if (formato === 'csv') {
      const csv = this.exportService.renderCsv(datos);
      return { buffer: Buffer.from(csv, 'utf-8'), contentType: 'text/csv', filename: `reporte-${tipo}-${fecha}.csv` };
    }
    if (formato === 'pdf') {
      const buffer = await this.exportService.renderPdf(datos);
      return { buffer, contentType: 'application/pdf', filename: `reporte-${tipo}-${fecha}.pdf` };
    }
    const buffer = await this.exportService.renderXlsx(datos);
    return {
      buffer,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: `reporte-${tipo}-${fecha}.xlsx`,
    };
  }

  async obtenerDashboard(tenantId: string) {
    const hoy = new Date().toISOString().slice(0, 10);
    const ahora = new Date();
    const hace6Meses = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() - 5, 1)).toISOString().slice(0, 10);

    const [datosTrabajadores, datosAsistencia, datosPagos, datosCostoLaboral, asistenciaHoy, adelantos, prestamos] =
      await Promise.all([
        this.reporteTrabajadores(tenantId),
        this.reporteAsistencia(tenantId, {}),
        this.reportePagos(tenantId, {}),
        this.reporteCostoLaboral(tenantId, { desde: hace6Meses }),
        this.listarAsistenciaDelDia(tenantId, hoy),
        this.prisma.adelanto.findMany({ where: { tenantId } }),
        this.prisma.prestamo.findMany({ where: { tenantId }, include: { abonos: true } }),
      ]);

    const presentesHoy = asistenciaHoy.filter((d) => d.asistencia?.estado === 'PRESENTE').length;
    const adelantosPendientes = adelantos.reduce(
      (acc, a) => acc + Math.max(0, Number(a.monto) - Number(a.montoDescontado)),
      0,
    );
    const prestamosPendientes = prestamos.reduce((acc, p) => {
      const pagado = p.abonos.reduce((s, ab) => s + Number(ab.monto), 0);
      return acc + Math.max(0, Number(p.montoOriginal) - pagado);
    }, 0);

    return {
      kpis: {
        totalTrabajadores: datosTrabajadores.resumen.Total,
        activos: datosTrabajadores.resumen.Activos,
        presentesHoy,
        jornadasPeriodo: datosAsistencia.resumen.Jornadas,
        horasTrabajadas: datosAsistencia.resumen['Horas trabajadas'],
        totalPagado: datosPagos.resumen['Total pagado (USD equiv.)'],
        adelantosPendientes: Number(adelantosPendientes.toFixed(2)),
        prestamosPendientes: Number(prestamosPendientes.toFixed(2)),
      },
      trabajadoresPorCargo: datosTrabajadores.tablas[0],
      costoLaboralPorMes: datosCostoLaboral.tablas[0],
      asistenciaReciente: datosAsistencia.tablas[0],
    };
  }
}
