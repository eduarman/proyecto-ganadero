import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { CrearAplicacionDto } from './dto/crear-aplicacion.dto';
import { CrearProductoSanitarioDto } from './dto/crear-producto-sanitario.dto';
import { SanidadService } from './sanidad.service';

@Controller('sanidad')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class SanidadController {
  constructor(private readonly sanidadService: SanidadService) {}

  @Get('productos')
  listarProductos(@CurrentUser() user: JwtPayload) {
    return this.sanidadService.listarProductos(user.tenantId as string);
  }

  @Post('productos')
  @Roles(RolUsuario.ADMIN_NEGOCIO, RolUsuario.MAYORDOMO)
  crearProducto(@CurrentUser() user: JwtPayload, @Body() dto: CrearProductoSanitarioDto) {
    return this.sanidadService.crearProducto(user.tenantId as string, dto);
  }

  @Post('aplicaciones')
  @Roles(RolUsuario.ADMIN_NEGOCIO, RolUsuario.MAYORDOMO, RolUsuario.OPERARIO)
  crearAplicacion(@CurrentUser() user: JwtPayload, @Body() dto: CrearAplicacionDto) {
    return this.sanidadService.crearAplicacion(user.tenantId as string, dto, user.sub);
  }

  @Get('aplicaciones')
  listar(@CurrentUser() user: JwtPayload) {
    return this.sanidadService.listar(user.tenantId as string);
  }

  @Get('aplicaciones/animal/:animalId')
  historialAnimal(@CurrentUser() user: JwtPayload, @Param('animalId') animalId: string) {
    return this.sanidadService.historialAnimal(user.tenantId as string, animalId);
  }

  @Get('alertas')
  alertas(@CurrentUser() user: JwtPayload) {
    return this.sanidadService.alertas(user.tenantId as string);
  }
}
