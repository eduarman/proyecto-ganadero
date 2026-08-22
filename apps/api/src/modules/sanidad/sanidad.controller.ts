import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { ActualizarProtocoloDto } from './dto/actualizar-protocolo.dto';
import { CrearAplicacionLoteDto } from './dto/crear-aplicacion-lote.dto';
import { CrearAplicacionDto } from './dto/crear-aplicacion.dto';
import { CrearCuarentenaDto } from './dto/crear-cuarentena.dto';
import { CrearDiagnosticoDto } from './dto/crear-diagnostico.dto';
import { CrearProductoSanitarioDto } from './dto/crear-producto-sanitario.dto';
import { CrearProtocoloDto } from './dto/crear-protocolo.dto';
import { FinalizarCuarentenaDto } from './dto/finalizar-cuarentena.dto';
import { ListarAplicacionesQueryDto } from './dto/listar-aplicaciones-query.dto';
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

  @Get('protocolos')
  listarProtocolos(@CurrentUser() user: JwtPayload) {
    return this.sanidadService.listarProtocolos(user.tenantId as string);
  }

  @Post('protocolos')
  @Roles(...ROLES_GESTION)
  crearProtocolo(@CurrentUser() user: JwtPayload, @Body() dto: CrearProtocoloDto) {
    return this.sanidadService.crearProtocolo(user.tenantId as string, dto);
  }

  @Patch('protocolos/:id')
  @Roles(...ROLES_GESTION)
  actualizarProtocolo(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ActualizarProtocoloDto,
  ) {
    return this.sanidadService.actualizarProtocolo(user.tenantId as string, id, dto);
  }

  @Post('aplicaciones')
  @Roles(...ROLES_REGISTRO)
  crearAplicacion(@CurrentUser() user: JwtPayload, @Body() dto: CrearAplicacionDto) {
    return this.sanidadService.crearAplicacion(user.tenantId as string, dto, user.sub);
  }

  @Post('aplicaciones/lote')
  @Roles(...ROLES_REGISTRO)
  crearAplicacionLote(@CurrentUser() user: JwtPayload, @Body() dto: CrearAplicacionLoteDto) {
    return this.sanidadService.crearAplicacionLote(user.tenantId as string, dto, user.sub);
  }

  @Get('aplicaciones')
  listar(@CurrentUser() user: JwtPayload, @Query() query: ListarAplicacionesQueryDto) {
    return this.sanidadService.listar(user.tenantId as string, query);
  }

  @Get('aplicaciones/animal/:animalId')
  historialAnimal(@CurrentUser() user: JwtPayload, @Param('animalId') animalId: string) {
    return this.sanidadService.historialAnimal(user.tenantId as string, animalId);
  }

  @Post('diagnosticos')
  @Roles(...ROLES_REGISTRO)
  crearDiagnostico(@CurrentUser() user: JwtPayload, @Body() dto: CrearDiagnosticoDto) {
    return this.sanidadService.crearDiagnostico(user.tenantId as string, dto);
  }

  @Get('diagnosticos/animal/:animalId')
  historialDiagnosticos(@CurrentUser() user: JwtPayload, @Param('animalId') animalId: string) {
    return this.sanidadService.historialDiagnosticos(user.tenantId as string, animalId);
  }

  @Post('cuarentenas')
  @Roles(...ROLES_REGISTRO)
  iniciarCuarentena(@CurrentUser() user: JwtPayload, @Body() dto: CrearCuarentenaDto) {
    return this.sanidadService.iniciarCuarentena(user.tenantId as string, dto);
  }

  @Patch('cuarentenas/:id/finalizar')
  @Roles(...ROLES_REGISTRO)
  finalizarCuarentena(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: FinalizarCuarentenaDto,
  ) {
    return this.sanidadService.finalizarCuarentena(user.tenantId as string, id, dto);
  }

  @Get('cuarentenas')
  listarCuarentenas(
    @CurrentUser() user: JwtPayload,
    @Query('activas') activas?: string,
    @Query('animalId') animalId?: string,
  ) {
    const activasBool = activas === undefined ? undefined : activas === 'true';
    return this.sanidadService.listarCuarentenas(user.tenantId as string, activasBool, animalId);
  }

  @Get('alertas')
  alertas(@CurrentUser() user: JwtPayload) {
    return this.sanidadService.alertas(user.tenantId as string);
  }
}
