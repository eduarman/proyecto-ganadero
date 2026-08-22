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

// US-5.2: VETERINARIO_EXTERNO puede ver y registrar en sanidad igual que
// ADMIN_NEGOCIO/MAYORDOMO (security-roles.md lo marca RW completo para este
// módulo, a diferencia de su acceso nulo al resto de los módulos operativos).
const ROLES_GESTION = [RolUsuario.ADMIN_NEGOCIO, RolUsuario.MAYORDOMO, RolUsuario.VETERINARIO_EXTERNO] as const;
const ROLES_REGISTRO = [
  RolUsuario.ADMIN_NEGOCIO,
  RolUsuario.MAYORDOMO,
  RolUsuario.OPERARIO,
  RolUsuario.VETERINARIO_EXTERNO,
] as const;

@Controller('sanidad')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class SanidadController {
  constructor(private readonly sanidadService: SanidadService) {}

  @Get('productos')
  listarProductos(@CurrentUser() user: JwtPayload) {
    return this.sanidadService.listarProductos(user.tenantId as string);
  }

  @Post('productos')
  @Roles(...ROLES_GESTION)
  crearProducto(@CurrentUser() user: JwtPayload, @Body() dto: CrearProductoSanitarioDto) {
    return this.sanidadService.crearProducto(user.tenantId as string, dto);
  }

  @Post('aplicaciones')
  @Roles(...ROLES_REGISTRO)
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
