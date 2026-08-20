import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { ActualizarAnimalDto } from './dto/actualizar-animal.dto';
import { CrearAnimalDto } from './dto/crear-animal.dto';
import { DarBajaDto } from './dto/dar-baja.dto';
import { ListarAnimalesQueryDto } from './dto/listar-animales-query.dto';
import { GanadoService } from './ganado.service';

@Controller('ganado')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class GanadoController {
  constructor(private readonly ganadoService: GanadoService) {}

  @Get()
  listar(@CurrentUser() user: JwtPayload, @Query() query: ListarAnimalesQueryDto) {
    return this.ganadoService.listar(user.tenantId as string, query);
  }

  @Get(':id')
  obtener(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.ganadoService.obtener(user.tenantId as string, id);
  }

  @Post()
  @Roles(RolUsuario.ADMIN_NEGOCIO, RolUsuario.MAYORDOMO)
  crear(@CurrentUser() user: JwtPayload, @Body() dto: CrearAnimalDto) {
    return this.ganadoService.crear(user.tenantId as string, dto);
  }

  @Patch(':id')
  @Roles(RolUsuario.ADMIN_NEGOCIO, RolUsuario.MAYORDOMO)
  actualizar(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ActualizarAnimalDto,
  ) {
    return this.ganadoService.actualizar(user.tenantId as string, id, dto);
  }

  @Post(':id/baja')
  @Roles(RolUsuario.ADMIN_NEGOCIO, RolUsuario.MAYORDOMO)
  darBaja(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: DarBajaDto,
  ) {
    return this.ganadoService.darBaja(user.tenantId as string, id, dto, user.sub);
  }
}
