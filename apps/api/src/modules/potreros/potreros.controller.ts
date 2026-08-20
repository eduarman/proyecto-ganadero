import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { ActualizarPotreroDto } from './dto/actualizar-potrero.dto';
import { CrearPotreroDto } from './dto/crear-potrero.dto';
import { PotrerosService } from './potreros.service';

@Controller('potreros')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class PotrerosController {
  constructor(private readonly potrerosService: PotrerosService) {}

  @Get()
  listar(@CurrentUser() user: JwtPayload) {
    return this.potrerosService.listar(user.tenantId as string);
  }

  @Get(':id')
  obtener(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.potrerosService.obtener(user.tenantId as string, id);
  }

  @Post()
  @Roles(RolUsuario.ADMIN_NEGOCIO, RolUsuario.MAYORDOMO)
  crear(@CurrentUser() user: JwtPayload, @Body() dto: CrearPotreroDto) {
    return this.potrerosService.crear(user.tenantId as string, dto);
  }

  @Patch(':id')
  @Roles(RolUsuario.ADMIN_NEGOCIO, RolUsuario.MAYORDOMO)
  actualizar(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ActualizarPotreroDto,
  ) {
    return this.potrerosService.actualizar(user.tenantId as string, id, dto);
  }

  @Patch(':id/inactivar')
  @Roles(RolUsuario.ADMIN_NEGOCIO, RolUsuario.MAYORDOMO)
  inactivar(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.potrerosService.inactivar(user.tenantId as string, id);
  }

  @Patch(':id/activar')
  @Roles(RolUsuario.ADMIN_NEGOCIO, RolUsuario.MAYORDOMO)
  activar(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.potrerosService.activar(user.tenantId as string, id);
  }
}
