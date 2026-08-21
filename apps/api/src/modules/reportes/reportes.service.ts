import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TipoReporte } from '@prisma/client';
import { calcularCategoriaEtaria } from '../ganado/categoria-etaria.util';
import { AlimentacionService } from '../alimentacion/alimentacion.service';
import { clasificarOcupacion } from '../potreros/ocupacion.util';
import { PotrerosService } from '../potreros/potreros.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SanidadService } from '../sanidad/sanidad.service';
import { FiltrosReporteDto } from './dto/filtros-reporte.dto';
import { GenerarReporteDto } from './dto/generar-reporte.dto';
import { ExportService } from './export.service';
import { DatosReporte, TIPOS_REPORTE } from './reportes.types';
import { StorageService } from './storage.service';

const MESES_DEFECTO = 6;
const NOMBRES_MES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function claveMes(fecha: Date): string {
  return `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, '0')}`;
}

function etiquetaMes(clave: string): string {
  const [anio, mes] = clave.split('-');
  return `${NOMBRES_MES[Number(mes) - 1]} ${anio}`;
}

function resolverRango(filtros: FiltrosReporteDto): { desde: Date; hasta: Date } {
  const hasta = filtros.hasta ? new Date(filtros.hasta) : new Date();
  const desde = filtros.desde
    ? new Date(filtros.desde)
    : new Date(Date.UTC(hasta.getUTCFullYear(), hasta.getUTCMonth() - (MESES_DEFECTO - 1), 1));
  return { desde, hasta };
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

@Injectable()
export class ReportesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alimentacionService: AlimentacionService,
    private readonly potrerosService: PotrerosService,
    private readonly sanidadService: SanidadService,
    private readonly exportService: ExportService,
    private readonly storageService: StorageService,
  ) {}

  async tipos(tenantId: string, rol: string) {
    const tipos =
      rol === 'VETERINARIO_EXTERNO' ? TIPOS_REPORTE.filter((t) => t.tipo === 'CUMPLIMIENTO_SANITARIO') : TIPOS_REPORTE;
    const consolidadoDisponible = rol === 'ADMIN_NEGOCIO' ? await this.consolidadoDisponible(tenantId) : false;
    return { tipos, consolidadoDisponible };
  }

  private async inventarioGanado(tenantId: string, filtros: FiltrosReporteDto): Promise<DatosReporte> {
    const animales = await this.prisma.animal.findMany({
      where: { tenantId, ...(filtros.potreroId && { potreroActualId: filtros.potreroId }) },
      select: { fechaNacimiento: true, sexo: true, especie: true, estado: true, potreroActual: { select: { nombre: true } } },
    });

    const porCategoria = new Map<string, number>();
    const porPotrero = new Map<string, number>();
    const porEstado = new Map<string, number>();

    for (const a of animales) {
      const categoria = calcularCategoriaEtaria(a.fechaNacimiento, a.sexo, a.especie) ?? 'Sin edad registrada';
      porCategoria.set(categoria, (porCategoria.get(categoria) ?? 0) + 1);
      const potrero = a.potreroActual?.nombre ?? 'Sin potrero';
      porPotrero.set(potrero, (porPotrero.get(potrero) ?? 0) + 1);
      porEstado.set(a.estado, (porEstado.get(a.estado) ?? 0) + 1);
    }

    return {
      tipo: 'INVENTARIO_GANADO',
      generadoEn: new Date().toISOString(),
      filtros: {},
      resumen: { 'Total de animales': animales.length },
      tablas: [
        { titulo: 'Por categoría', columnas: ['Categoría', 'Cantidad'], filas: Array.from(porCategoria.entries()) },
        { titulo: 'Por potrero', columnas: ['Potrero', 'Cantidad'], filas: Array.from(porPotrero.entries()) },
        { titulo: 'Por estado', columnas: ['Estado', 'Cantidad'], filas: Array.from(porEstado.entries()) },
      ],
    };
  }

  private async natalidadMortalidad(tenantId: string, filtros: FiltrosReporteDto): Promise<DatosReporte> {
    const { desde, hasta } = resolverRango(filtros);
    const [partos, bajas] = await Promise.all([
      this.prisma.parto.findMany({ where: { tenantId, fecha: { gte: desde, lte: hasta } }, select: { fecha: true } }),
      this.prisma.animalBaja.findMany({
        where: { tenantId, motivo: 'MUERTE', fecha: { gte: desde, lte: hasta } },
        select: { fecha: true },
      }),
    ]);

    const claves = mesesEnRango(desde, hasta);
    const natalidadPorMes = new Map(claves.map((c) => [c, 0]));
    const mortalidadPorMes = new Map(claves.map((c) => [c, 0]));
    for (const p of partos) natalidadPorMes.set(claveMes(p.fecha), (natalidadPorMes.get(claveMes(p.fecha)) ?? 0) + 1);
    for (const b of bajas) mortalidadPorMes.set(claveMes(b.fecha), (mortalidadPorMes.get(claveMes(b.fecha)) ?? 0) + 1);

    return {
      tipo: 'NATALIDAD_MORTALIDAD',
      generadoEn: new Date().toISOString(),
      filtros: { desde: desde.toISOString(), hasta: hasta.toISOString() },
      resumen: { Nacimientos: partos.length, Muertes: bajas.length },
      tablas: [
        {
          titulo: 'Por mes',
          columnas: ['Mes', 'Nacimientos', 'Muertes'],
          filas: claves.map((c) => [etiquetaMes(c), natalidadPorMes.get(c) ?? 0, mortalidadPorMes.get(c) ?? 0]),
        },
      ],
    };
  }

  private async produccionMensual(tenantId: string, filtros: FiltrosReporteDto) {
    const { desde, hasta } = resolverRango(filtros);
    const [registros, totales] = await Promise.all([
      this.prisma.registroLeche.findMany({
        where: {
          tenantId,
          fecha: { gte: desde, lte: hasta },
          ...(filtros.potreroId && { animal: { potreroActualId: filtros.potreroId } }),
        },
      }),
      // Los "totales por turno" son a nivel de hato, sin animal/potrero
      // asociado — se excluyen cuando se filtra por potrero (no hay forma
      // honesta de atribuirlos a uno en particular).
      filtros.potreroId
        ? Promise.resolve([])
        : this.prisma.registroLecheTotal.findMany({ where: { tenantId, fecha: { gte: desde, lte: hasta } } }),
    ]);

    const claves = mesesEnRango(desde, hasta);
    const porMes = new Map(claves.map((c) => [c, 0]));
    for (const r of registros) porMes.set(claveMes(r.fecha), (porMes.get(claveMes(r.fecha)) ?? 0) + Number(r.litros));
    for (const t of totales) porMes.set(claveMes(t.fecha), (porMes.get(claveMes(t.fecha)) ?? 0) + Number(t.litrosTotal));

    const litrosTotalGeneral = Array.from(porMes.values()).reduce((acc, v) => acc + v, 0);
    return { desde, hasta, claves, porMes, litrosTotalGeneral };
  }

  private async produccion(tenantId: string, filtros: FiltrosReporteDto): Promise<DatosReporte> {
    const { claves, porMes, litrosTotalGeneral, desde, hasta } = await this.produccionMensual(tenantId, filtros);

    return {
      tipo: 'PRODUCCION',
      generadoEn: new Date().toISOString(),
      filtros: { desde: desde.toISOString(), hasta: hasta.toISOString() },
      resumen: { 'Litros totales': Number(litrosTotalGeneral.toFixed(1)) },
      tablas: [
        {
          titulo: 'Litros por mes',
          columnas: ['Mes', 'Litros'],
          filas: claves.map((c) => [etiquetaMes(c), Number((porMes.get(c) ?? 0).toFixed(1))]),
        },
      ],
    };
  }

  private async costosAlimentacion(tenantId: string, filtros: FiltrosReporteDto): Promise<DatosReporte> {
    const { desde, hasta } = resolverRango(filtros);
    const costos = await this.alimentacionService.costos(tenantId, desde, hasta, filtros.potreroId);

    return {
      tipo: 'COSTOS_ALIMENTACION',
      generadoEn: new Date().toISOString(),
      filtros: { desde: desde.toISOString(), hasta: hasta.toISOString() },
      resumen: {
        'Costo total': Number(costos.costoTotalGeneral.toFixed(2)),
        'Consumo total (kg)': Number(costos.consumoTotalKg.toFixed(1)),
        'Costo parcial': costos.costoParcial ? 'Sí (hay insumos sin costo cargado)' : 'No',
      },
      tablas: [
        {
          titulo: 'Por insumo',
          columnas: ['Insumo', 'Cantidad', 'Costo'],
          filas: costos.porTipo.map((c) => [c.nombre, c.cantidad, c.costoTotal !== null ? Number(c.costoTotal.toFixed(2)) : 'Sin costo']),
        },
      ],
    };
  }

  private async cumplimientoSanitario(tenantId: string): Promise<DatosReporte> {
    const c = await this.sanidadService.cumplimiento(tenantId);

    return {
      tipo: 'CUMPLIMIENTO_SANITARIO',
      generadoEn: new Date().toISOString(),
      filtros: {},
      resumen: {
        'Total con refuerzo programado': c.total,
        'Al día': c.alDia,
        Atrasadas: c.vencidas,
        '% al día': `${c.porcentajeAlDia.toFixed(1)}%`,
      },
      tablas: [
        {
          titulo: 'Cumplimiento',
          columnas: ['Estado', 'Cantidad'],
          filas: [
            ['Al día', c.alDia],
            ['Atrasadas', c.vencidas],
          ],
        },
      ],
    };
  }

  private async ocupacionPotreros(tenantId: string, filtros: FiltrosReporteDto): Promise<DatosReporte> {
    const todos = await this.potrerosService.listar(tenantId);
    const potreros = filtros.potreroId ? todos.filter((p) => p.id === filtros.potreroId) : todos;
    const clasificacion = clasificarOcupacion(potreros);

    return {
      tipo: 'OCUPACION_POTREROS',
      generadoEn: new Date().toISOString(),
      filtros: {},
      resumen: {
        Normal: clasificacion.normal,
        'Cerca del límite': clasificacion.cercaLimite,
        Sobrecargado: clasificacion.sobrecargado,
      },
      tablas: [
        {
          titulo: 'Detalle por potrero',
          columnas: ['Potrero', 'Ocupación actual', 'Capacidad de carga'],
          filas: potreros.map((p) => [p.nombre, p.ocupacionActual, p.capacidadCarga ? Number(p.capacidadCarga) : 'Sin definir']),
        },
      ],
    };
  }

  private async costosPorMes(
    tenantId: string,
    desde: Date,
    hasta: Date,
    potreroId?: string,
  ): Promise<{ claves: string[]; porMes: Map<string, number>; total: number }> {
    const suministros = await this.prisma.suministro.findMany({
      where: { tenantId, fecha: { gte: desde, lte: hasta }, ...(potreroId && { potreroId }) },
      include: { insumo: true },
    });

    const claves = mesesEnRango(desde, hasta);
    const porMes = new Map(claves.map((c) => [c, 0]));
    for (const s of suministros) {
      if (s.insumo.costoUnitario === null) continue;
      const clave = claveMes(s.fecha);
      const costo = Number(s.cantidad) * Number(s.insumo.costoUnitario);
      porMes.set(clave, (porMes.get(clave) ?? 0) + costo);
    }
    const total = Array.from(porMes.values()).reduce((acc, v) => acc + v, 0);
    return { claves, porMes, total };
  }

  private async costoVsProduccion(tenantId: string, filtros: FiltrosReporteDto): Promise<DatosReporte> {
    const { desde, hasta } = resolverRango(filtros);
    const [costosMes, { claves, porMes: litrosPorMes, litrosTotalGeneral }] = await Promise.all([
      this.costosPorMes(tenantId, desde, hasta, filtros.potreroId),
      this.produccionMensual(tenantId, filtros),
    ]);

    const costoPorLitro = litrosTotalGeneral > 0 ? costosMes.total / litrosTotalGeneral : null;

    return {
      tipo: 'COSTO_VS_PRODUCCION',
      generadoEn: new Date().toISOString(),
      filtros: { desde: desde.toISOString(), hasta: hasta.toISOString() },
      resumen: {
        'Costo total de alimentación': Number(costosMes.total.toFixed(2)),
        'Litros totales': Number(litrosTotalGeneral.toFixed(1)),
        'Costo por litro': costoPorLitro !== null ? Number(costoPorLitro.toFixed(3)) : 'Sin producción registrada',
      },
      tablas: [
        {
          titulo: 'Por mes',
          columnas: ['Mes', 'Litros', 'Costo alimentación'],
          filas: claves.map((c) => [
            etiquetaMes(c),
            Number((litrosPorMes.get(c) ?? 0).toFixed(1)),
            Number((costosMes.porMes.get(c) ?? 0).toFixed(2)),
          ]),
        },
      ],
    };
  }

  async obtenerDatos(tipo: TipoReporte, filtros: FiltrosReporteDto, tenantId: string): Promise<DatosReporte> {
    switch (tipo) {
      case 'INVENTARIO_GANADO':
        return this.inventarioGanado(tenantId, filtros);
      case 'NATALIDAD_MORTALIDAD':
        return this.natalidadMortalidad(tenantId, filtros);
      case 'PRODUCCION':
        return this.produccion(tenantId, filtros);
      case 'COSTOS_ALIMENTACION':
        return this.costosAlimentacion(tenantId, filtros);
      case 'CUMPLIMIENTO_SANITARIO':
        return this.cumplimientoSanitario(tenantId);
      case 'OCUPACION_POTREROS':
        return this.ocupacionPotreros(tenantId, filtros);
      case 'COSTO_VS_PRODUCCION':
        return this.costoVsProduccion(tenantId, filtros);
      default:
        throw new BadRequestException(`Tipo de reporte no soportado: ${tipo}`);
    }
  }

  private validarTipo(tipoParam: string): TipoReporte {
    const normalizado = tipoParam.toUpperCase();
    const encontrado = TIPOS_REPORTE.find((t) => t.tipo === normalizado);
    if (!encontrado) {
      throw new BadRequestException(`Tipo de reporte no soportado: ${tipoParam}`);
    }
    return encontrado.tipo;
  }

  private assertAccesoTipo(rol: string, tipo: TipoReporte): void {
    if (rol === 'VETERINARIO_EXTERNO' && tipo !== 'CUMPLIMIENTO_SANITARIO') {
      throw new ForbiddenException('Tu acceso solo permite el reporte de cumplimiento sanitario.');
    }
  }

  async generar(tenantId: string, tipoParam: string, dto: GenerarReporteDto, solicitadoPorId: string, rol: string) {
    const tipo = this.validarTipo(tipoParam);
    this.assertAccesoTipo(rol, tipo);

    const filtros = dto.filtros ?? {};
    const registro = await this.prisma.reporteGenerado.create({
      data: {
        tenantId,
        tipo,
        filtrosJson: filtros as unknown as Prisma.InputJsonObject,
        formato: dto.formato,
        estado: 'PENDIENTE',
        solicitadoPorId,
      },
    });

    try {
      await this.prisma.reporteGenerado.update({ where: { id: registro.id }, data: { estado: 'GENERANDO' } });
      const datos = await this.obtenerDatos(tipo, filtros, tenantId);
      const buffer =
        dto.formato === 'PDF' ? await this.exportService.renderPdf(datos) : await this.exportService.renderXlsx(datos);
      const extension = dto.formato === 'PDF' ? 'pdf' : 'xlsx';
      const contentType =
        dto.formato === 'PDF' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const path = `${tenantId}/${registro.id}.${extension}`;

      await this.storageService.subir(path, buffer, contentType);
      const archivoUrl = await this.storageService.firmarUrl(path);

      const actualizado = await this.prisma.reporteGenerado.update({
        where: { id: registro.id },
        data: { estado: 'LISTO', archivoPath: path, completadoEn: new Date() },
      });
      return { ...actualizado, archivoUrl };
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido al generar el reporte.';
      await this.prisma.reporteGenerado.update({
        where: { id: registro.id },
        data: { estado: 'ERROR', errorMensaje: mensaje },
      });
      throw error;
    }
  }

  async obtenerGenerado(tenantId: string, id: string) {
    const reporte = await this.prisma.reporteGenerado.findFirst({ where: { id, tenantId } });
    if (!reporte) {
      throw new NotFoundException('Reporte no encontrado.');
    }
    const archivoUrl =
      reporte.archivoPath && reporte.estado === 'LISTO' ? await this.storageService.firmarUrl(reporte.archivoPath) : null;
    return { ...reporte, archivoUrl };
  }

  listarGenerados(tenantId: string) {
    return this.prisma.reporteGenerado.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async consolidadoDisponible(tenantId: string): Promise<boolean> {
    const negocio = await this.prisma.negocio.findUnique({
      where: { id: tenantId },
      include: { cuenta: { include: { plan: true } } },
    });
    return (negocio?.cuenta.plan.maxNegocios ?? 1) > 1;
  }

  async consolidado(tenantId: string, tipoParam: string, filtros: FiltrosReporteDto) {
    const tipo = this.validarTipo(tipoParam);
    const negocio = await this.prisma.negocio.findUnique({
      where: { id: tenantId },
      include: { cuenta: { include: { plan: true, negocios: true } } },
    });
    if (!negocio) {
      throw new NotFoundException('Negocio no encontrado.');
    }
    if (negocio.cuenta.plan.maxNegocios <= 1) {
      throw new ForbiddenException('Tu plan no incluye reportes consolidados multi-negocio.');
    }

    const porNegocio = await Promise.all(
      negocio.cuenta.negocios.map(async (n) => ({
        negocioId: n.id,
        negocioNombre: n.nombre,
        datos: await this.obtenerDatos(tipo, filtros, n.id),
      })),
    );

    return { tipo, negocios: porNegocio };
  }
}
