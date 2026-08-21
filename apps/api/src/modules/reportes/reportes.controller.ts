import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { ConsolidadoReporteDto } from './dto/consolidado-reporte.dto';
import { GenerarReporteDto } from './dto/generar-reporte.dto';
import { ReportesService } from './reportes.service';

const ROLES_REPORTES = [RolUsuario.ADMIN_NEGOCIO, RolUsuario.MAYORDOMO, RolUsuario.VETERINARIO_EXTERNO] as const;

@Controller('reportes')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('tipos')
  @Roles(...ROLES_REPORTES)
  tipos(@CurrentUser() user: JwtPayload) {
    return this.reportesService.tipos(user.tenantId as string, user.rol as string);
  }

  @Post(':tipo/generar')
  @Roles(...ROLES_REPORTES)
  generar(@CurrentUser() user: JwtPayload, @Param('tipo') tipo: string, @Body() dto: GenerarReporteDto) {
    return this.reportesService.generar(user.tenantId as string, tipo, dto, user.sub, user.rol as string);
  }

  @Get('generados/:id')
  @Roles(RolUsuario.ADMIN_NEGOCIO, RolUsuario.MAYORDOMO)
  obtenerGenerado(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.reportesService.obtenerGenerado(user.tenantId as string, id);
  }

  @Get('generados')
  @Roles(RolUsuario.ADMIN_NEGOCIO, RolUsuario.MAYORDOMO)
  listarGenerados(@CurrentUser() user: JwtPayload) {
    return this.reportesService.listarGenerados(user.tenantId as string);
  }

  @Post('consolidado')
  @Roles(RolUsuario.ADMIN_NEGOCIO)
  consolidado(@CurrentUser() user: JwtPayload, @Body() dto: ConsolidadoReporteDto) {
    return this.reportesService.consolidado(user.tenantId as string, dto.tipo, dto.filtros ?? {});
  }
}
