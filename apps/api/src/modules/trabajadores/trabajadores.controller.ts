import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { ActualizarTrabajadorDto } from './dto/actualizar-trabajador.dto';
import { CrearAsignacionDto } from './dto/crear-asignacion.dto';
import { CrearCargoDto } from './dto/crear-cargo.dto';
import { CrearTrabajadorDto } from './dto/crear-trabajador.dto';
import { FinalizarAsignacionDto } from './dto/finalizar-asignacion.dto';
import { ListarTrabajadoresQueryDto } from './dto/listar-trabajadores-query.dto';
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
}
