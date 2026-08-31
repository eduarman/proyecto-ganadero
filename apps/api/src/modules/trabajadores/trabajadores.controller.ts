import { Body, Controller, Get, Param, Patch, Post, Query, Res, StreamableFile, UseGuards } from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import type { Response } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { ActualizarTrabajadorDto } from './dto/actualizar-trabajador.dto';
import { ConfirmarPagoDto } from './dto/confirmar-pago.dto';
import { CrearAbonoPrestamoDto } from './dto/crear-abono-prestamo.dto';
import { CrearAdelantoDto } from './dto/crear-adelanto.dto';
import { CrearAsignacionDto } from './dto/crear-asignacion.dto';
import { CrearAsistenciaDto } from './dto/crear-asistencia.dto';
import { CrearCargoDto } from './dto/crear-cargo.dto';
import { CrearPrestamoDto } from './dto/crear-prestamo.dto';
import { CrearTrabajadorDto } from './dto/crear-trabajador.dto';
import { ExportarReporteTrabajadorDto } from './dto/exportar-reporte-trabajador.dto';
import { FiltrosReporteTrabajadorDto } from './dto/filtros-reporte-trabajador.dto';
import { FinalizarAsignacionDto } from './dto/finalizar-asignacion.dto';
import { ListarAsistenciaDiaQueryDto } from './dto/listar-asistencia-dia-query.dto';
import { ListarTrabajadoresQueryDto } from './dto/listar-trabajadores-query.dto';
import { PrevisualizarPagoDto } from './dto/previsualizar-pago.dto';
import { TrabajadoresService } from './trabajadores.service';

@Controller('trabajadores')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles(RolUsuario.ADMIN_NEGOCIO, RolUsuario.MAYORDOMO)
export class TrabajadoresController {
  constructor(private readonly trabajadoresService: TrabajadoresService) {}

  @Get('cargos')
  listarCargos(@CurrentUser() user: JwtPayload) {
    return this.trabajadoresService.listarCargos(user.tenantId as string);
  }

  @Post('cargos')
  crearCargo(@CurrentUser() user: JwtPayload, @Body() dto: CrearCargoDto) {
    return this.trabajadoresService.crearCargo(user.tenantId as string, dto);
  }

  @Patch('cargos/:id/activar')
  activarCargo(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.trabajadoresService.activarCargo(user.tenantId as string, id);
  }

  @Patch('cargos/:id/inactivar')
  inactivarCargo(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.trabajadoresService.inactivarCargo(user.tenantId as string, id);
  }

  @Get('asistencias/dia')
  listarAsistenciaDelDia(@CurrentUser() user: JwtPayload, @Query() query: ListarAsistenciaDiaQueryDto) {
    return this.trabajadoresService.listarAsistenciaDelDia(user.tenantId as string, query.fecha);
  }

  @Get('reportes/:tipo')
  obtenerReporte(
    @CurrentUser() user: JwtPayload,
    @Param('tipo') tipo: string,
    @Query() query: FiltrosReporteTrabajadorDto,
  ) {
    return this.trabajadoresService.obtenerReporte(user.tenantId as string, tipo, query);
  }

  @Get('reportes/:tipo/exportar')
  async exportarReporte(
    @CurrentUser() user: JwtPayload,
    @Param('tipo') tipo: string,
    @Query() query: ExportarReporteTrabajadorDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, contentType, filename } = await this.trabajadoresService.exportarReporte(
      user.tenantId as string,
      tipo,
      query,
    );
    res.set({ 'Content-Type': contentType, 'Content-Disposition': `attachment; filename="${filename}"` });
    return new StreamableFile(buffer);
  }

  @Get()
  listar(@CurrentUser() user: JwtPayload, @Query() query: ListarTrabajadoresQueryDto) {
    return this.trabajadoresService.listar(user.tenantId as string, query);
  }

  @Post()
  crear(@CurrentUser() user: JwtPayload, @Body() dto: CrearTrabajadorDto) {
    return this.trabajadoresService.crear(user.tenantId as string, dto);
  }

  @Get(':id')
  obtener(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.trabajadoresService.obtener(user.tenantId as string, id);
  }

  @Patch(':id')
  actualizar(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: ActualizarTrabajadorDto) {
    return this.trabajadoresService.actualizar(user.tenantId as string, id, dto);
  }

  @Patch(':id/activar')
  activar(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.trabajadoresService.activar(user.tenantId as string, id);
  }

  @Patch(':id/inactivar')
  inactivar(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.trabajadoresService.inactivar(user.tenantId as string, id);
  }

  @Get(':id/asignaciones')
  listarAsignaciones(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.trabajadoresService.listarAsignaciones(user.tenantId as string, id);
  }

  @Post(':id/asignaciones')
  crearAsignacion(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: CrearAsignacionDto) {
    return this.trabajadoresService.crearAsignacion(user.tenantId as string, id, dto);
  }

  @Patch('asignaciones/:asignacionId/finalizar')
  finalizarAsignacion(
    @CurrentUser() user: JwtPayload,
    @Param('asignacionId') asignacionId: string,
    @Body() dto: FinalizarAsignacionDto,
  ) {
    return this.trabajadoresService.finalizarAsignacion(user.tenantId as string, asignacionId, dto);
  }

  @Get(':id/asistencias')
  listarAsistencias(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.trabajadoresService.listarAsistencias(user.tenantId as string, id);
  }

  @Post(':id/asistencias')
  crearAsistencia(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: CrearAsistenciaDto) {
    return this.trabajadoresService.crearAsistencia(user.tenantId as string, id, dto, user.sub);
  }

  @Get(':id/adelantos')
  listarAdelantos(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.trabajadoresService.listarAdelantos(user.tenantId as string, id);
  }

  @Post(':id/adelantos')
  @Roles(RolUsuario.ADMIN_NEGOCIO)
  crearAdelanto(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: CrearAdelantoDto) {
    return this.trabajadoresService.crearAdelanto(user.tenantId as string, id, dto, user.sub);
  }

  @Get(':id/prestamos')
  listarPrestamos(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.trabajadoresService.listarPrestamos(user.tenantId as string, id);
  }

  @Post(':id/prestamos')
  @Roles(RolUsuario.ADMIN_NEGOCIO)
  crearPrestamo(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: CrearPrestamoDto) {
    return this.trabajadoresService.crearPrestamo(user.tenantId as string, id, dto, user.sub);
  }

  @Post('prestamos/:prestamoId/abonos')
  @Roles(RolUsuario.ADMIN_NEGOCIO)
  crearAbonoPrestamo(
    @CurrentUser() user: JwtPayload,
    @Param('prestamoId') prestamoId: string,
    @Body() dto: CrearAbonoPrestamoDto,
  ) {
    return this.trabajadoresService.crearAbonoPrestamo(user.tenantId as string, prestamoId, dto);
  }

  @Get(':id/pagos')
  listarPagos(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.trabajadoresService.listarPagos(user.tenantId as string, id);
  }

  @Post(':id/pagos/previsualizar')
  previsualizarPago(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: PrevisualizarPagoDto) {
    return this.trabajadoresService.previsualizarPago(user.tenantId as string, id, dto);
  }

  @Post(':id/pagos')
  @Roles(RolUsuario.ADMIN_NEGOCIO)
  confirmarPago(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: ConfirmarPagoDto) {
    return this.trabajadoresService.confirmarPago(user.tenantId as string, id, dto, user.sub);
  }
}
