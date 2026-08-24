import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { CrearCeloDto } from './dto/crear-celo.dto';
import { CrearDesteteDto } from './dto/crear-destete.dto';
import { CrearDiagnosticoDto } from './dto/crear-diagnostico.dto';
import { CrearPartoDto } from './dto/crear-parto.dto';
import { CrearServicioDto } from './dto/crear-servicio.dto';
import { ReproduccionService } from './reproduccion.service';

const ROLES_ESCRITURA = [RolUsuario.ADMIN_NEGOCIO, RolUsuario.MAYORDOMO, RolUsuario.OPERARIO] as const;

@Controller('reproduccion')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class ReproduccionController {
  constructor(private readonly reproduccionService: ReproduccionService) {}

  @Post('servicios')
  @Roles(...ROLES_ESCRITURA)
  crearServicio(@CurrentUser() user: JwtPayload, @Body() dto: CrearServicioDto) {
    return this.reproduccionService.crearServicio(user.tenantId as string, dto);
  }

  @Post('diagnosticos')
  @Roles(...ROLES_ESCRITURA)
  crearDiagnostico(@CurrentUser() user: JwtPayload, @Body() dto: CrearDiagnosticoDto) {
    return this.reproduccionService.crearDiagnostico(user.tenantId as string, dto);
  }

  @Post('partos')
  @Roles(...ROLES_ESCRITURA)
  crearParto(@CurrentUser() user: JwtPayload, @Body() dto: CrearPartoDto) {
    return this.reproduccionService.crearParto(user.tenantId as string, dto);
  }

  @Post('celos')
  @Roles(...ROLES_ESCRITURA)
  crearCelo(@CurrentUser() user: JwtPayload, @Body() dto: CrearCeloDto) {
    return this.reproduccionService.crearCelo(user.tenantId as string, dto);
  }

  @Post('destetes')
  @Roles(...ROLES_ESCRITURA)
  crearDestete(@CurrentUser() user: JwtPayload, @Body() dto: CrearDesteteDto) {
    return this.reproduccionService.crearDestete(user.tenantId as string, dto);
  }

  @Get('servicios')
  listarServicios(@CurrentUser() user: JwtPayload, @Query('animalId') animalId?: string) {
    return this.reproduccionService.listarServicios(user.tenantId as string, animalId);
  }

  @Get('servicios/pendientes')
  pendientesDiagnostico(@CurrentUser() user: JwtPayload) {
    return this.reproduccionService.pendientesDiagnostico(user.tenantId as string);
  }

  @Get('calendario')
  calendario(@CurrentUser() user: JwtPayload) {
    return this.reproduccionService.calendario(user.tenantId as string);
  }
}
