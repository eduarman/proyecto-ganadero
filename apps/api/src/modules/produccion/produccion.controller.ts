import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { CrearRegistroLecheDto } from './dto/crear-registro-leche.dto';
import { CrearRegistroPesoLoteDto } from './dto/crear-registro-peso-lote.dto';
import { CrearRegistroPesoDto } from './dto/crear-registro-peso.dto';
import { CrearRegistroTotalDto } from './dto/crear-registro-total.dto';
import { ProduccionService } from './produccion.service';

const ROLES_REGISTRO = [RolUsuario.ADMIN_NEGOCIO, RolUsuario.MAYORDOMO, RolUsuario.OPERARIO] as const;

@Controller('produccion')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class ProduccionController {
  constructor(private readonly produccionService: ProduccionService) {}

  @Get('leche')
  listar(@CurrentUser() user: JwtPayload, @Query('animalId') animalId?: string) {
    return this.produccionService.listar(user.tenantId as string, animalId);
  }

  @Post('leche')
  @Roles(RolUsuario.ADMIN_NEGOCIO, RolUsuario.MAYORDOMO, RolUsuario.OPERARIO)
  registrarLeche(@CurrentUser() user: JwtPayload, @Body() dto: CrearRegistroLecheDto) {
    return this.produccionService.registrarLeche(user.tenantId as string, dto, user.sub);
  }

  @Get('leche/total')
  listarTotales(@CurrentUser() user: JwtPayload) {
    return this.produccionService.listarTotales(user.tenantId as string);
  }

  @Post('leche/total')
  @Roles(RolUsuario.ADMIN_NEGOCIO, RolUsuario.MAYORDOMO)
  registrarTotal(@CurrentUser() user: JwtPayload, @Body() dto: CrearRegistroTotalDto) {
    return this.produccionService.registrarTotal(user.tenantId as string, dto, user.sub);
  }

  @Get('indicadores')
  indicadores(@CurrentUser() user: JwtPayload) {
    return this.produccionService.indicadores(user.tenantId as string);
  }

  @Get('peso')
  listarPesos(@CurrentUser() user: JwtPayload, @Query('animalId') animalId?: string) {
    return this.produccionService.listarPesos(user.tenantId as string, animalId);
  }

  @Post('peso')
  @Roles(...ROLES_REGISTRO)
  registrarPeso(@CurrentUser() user: JwtPayload, @Body() dto: CrearRegistroPesoDto) {
    return this.produccionService.registrarPeso(user.tenantId as string, dto, user.sub);
  }

  @Post('peso/lote')
  @Roles(...ROLES_REGISTRO)
  registrarPesoLote(@CurrentUser() user: JwtPayload, @Body() dto: CrearRegistroPesoLoteDto) {
    return this.produccionService.registrarPesoLote(user.tenantId as string, dto, user.sub);
  }

  @Get('peso/gdp/:animalId')
  gdp(@CurrentUser() user: JwtPayload, @Param('animalId') animalId: string) {
    return this.produccionService.gdp(user.tenantId as string, animalId);
  }
}
