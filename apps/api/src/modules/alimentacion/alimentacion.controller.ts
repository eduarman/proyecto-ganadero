import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { AlimentacionService } from './alimentacion.service';
import { ActualizarSuministroRecurrenteDto } from './dto/actualizar-suministro-recurrente.dto';
import { CrearAsignacionDto } from './dto/crear-asignacion.dto';
import { CrearInsumoDto } from './dto/crear-insumo.dto';
import { CrearPlanDto } from './dto/crear-plan.dto';
import { CrearSuministroRecurrenteDto } from './dto/crear-suministro-recurrente.dto';
import { CrearSuministroDto } from './dto/crear-suministro.dto';
import { ListarCostosQueryDto } from './dto/listar-costos-query.dto';

const ROLES_GESTION = [RolUsuario.ADMIN_NEGOCIO, RolUsuario.MAYORDOMO] as const;
const ROLES_REGISTRO = [RolUsuario.ADMIN_NEGOCIO, RolUsuario.MAYORDOMO, RolUsuario.OPERARIO] as const;

@Controller('alimentacion')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class AlimentacionController {
  constructor(private readonly alimentacionService: AlimentacionService) {}

  @Get('insumos')
  listarInsumos(@CurrentUser() user: JwtPayload) {
    return this.alimentacionService.listarInsumos(user.tenantId as string);
  }

  @Post('insumos')
  @Roles(...ROLES_GESTION)
  crearInsumo(@CurrentUser() user: JwtPayload, @Body() dto: CrearInsumoDto) {
    return this.alimentacionService.crearInsumo(user.tenantId as string, dto);
  }

  @Patch('insumos/:id/inactivar')
  @Roles(...ROLES_GESTION)
  inactivarInsumo(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.alimentacionService.inactivarInsumo(user.tenantId as string, id);
  }

  @Patch('insumos/:id/activar')
  @Roles(...ROLES_GESTION)
  activarInsumo(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.alimentacionService.activarInsumo(user.tenantId as string, id);
  }

  @Get('planes')
  listarPlanes(@CurrentUser() user: JwtPayload) {
    return this.alimentacionService.listarPlanes(user.tenantId as string);
  }

  @Post('planes')
  @Roles(...ROLES_GESTION)
  crearPlan(@CurrentUser() user: JwtPayload, @Body() dto: CrearPlanDto) {
    return this.alimentacionService.crearPlan(user.tenantId as string, dto);
  }

  @Post('planes/:id/asignaciones')
  @Roles(...ROLES_GESTION)
  crearAsignacion(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: CrearAsignacionDto) {
    return this.alimentacionService.crearAsignacion(user.tenantId as string, id, dto);
  }

  @Get('suministros')
  listarSuministros(@CurrentUser() user: JwtPayload) {
    return this.alimentacionService.listarSuministros(user.tenantId as string);
  }

  @Post('suministros')
  @Roles(...ROLES_REGISTRO)
  crearSuministro(@CurrentUser() user: JwtPayload, @Body() dto: CrearSuministroDto) {
    return this.alimentacionService.crearSuministro(user.tenantId as string, dto, user.sub);
  }

  @Post('suministros/recurrentes')
  @Roles(...ROLES_REGISTRO)
  crearSuministroRecurrente(@CurrentUser() user: JwtPayload, @Body() dto: CrearSuministroRecurrenteDto) {
    return this.alimentacionService.crearSuministroRecurrente(user.tenantId as string, dto, user.sub);
  }

  @Get('suministros/recurrentes')
  listarSuministrosRecurrentes(@CurrentUser() user: JwtPayload) {
    return this.alimentacionService.listarSuministrosRecurrentes(user.tenantId as string);
  }

  @Patch('suministros/recurrentes/:id')
  @Roles(...ROLES_GESTION)
  actualizarSuministroRecurrente(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ActualizarSuministroRecurrenteDto,
  ) {
    return this.alimentacionService.actualizarSuministroRecurrente(user.tenantId as string, id, dto);
  }

  @Get('costos')
  @Roles(...ROLES_GESTION)
  costos(@CurrentUser() user: JwtPayload, @Query() query: ListarCostosQueryDto) {
    return this.alimentacionService.costos(
      user.tenantId as string,
      query.desde ? new Date(query.desde) : undefined,
      query.hasta ? new Date(query.hasta) : undefined,
      query.potreroId,
    );
  }
}
