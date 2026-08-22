import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
import { MoverAnimalesDto } from './dto/mover-animales.dto';
import { GanadoImportacionService } from './ganado-importacion.service';
import { GanadoService } from './ganado.service';

const ROLES_GESTION = [RolUsuario.ADMIN_NEGOCIO, RolUsuario.MAYORDOMO] as const;
const ROLES_OPERATIVOS = [RolUsuario.ADMIN_NEGOCIO, RolUsuario.MAYORDOMO, RolUsuario.OPERARIO] as const;

@Controller('ganado')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class GanadoController {
  constructor(
    private readonly ganadoService: GanadoService,
    private readonly ganadoImportacionService: GanadoImportacionService,
  ) {}

  @Get()
  listar(@CurrentUser() user: JwtPayload, @Query() query: ListarAnimalesQueryDto) {
    return this.ganadoService.listar(user.tenantId as string, query);
  }

  @Get('plantilla-importacion')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="plantilla-ganado.csv"')
  async plantillaImportacion() {
    const buffer = await this.ganadoImportacionService.generarPlantilla();
    return new StreamableFile(buffer);
  }

  @Post('importar')
  @Roles(...ROLES_GESTION)
  @UseInterceptors(FileInterceptor('file'))
  importar(@CurrentUser() user: JwtPayload, @UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Debe adjuntarse un archivo CSV.');
    }
    return this.ganadoImportacionService.importar(user.tenantId as string, file.buffer);
  }

  @Post('movimientos')
  @Roles(...ROLES_OPERATIVOS)
  moverAnimales(@CurrentUser() user: JwtPayload, @Body() dto: MoverAnimalesDto) {
    return this.ganadoService.moverAnimales(user.tenantId as string, dto, user.sub);
  }

  @Get(':id')
  obtener(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.ganadoService.obtener(user.tenantId as string, id);
  }

  @Get(':id/movimientos')
  movimientosDeAnimal(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.ganadoService.movimientosDeAnimal(user.tenantId as string, id);
  }

  @Post()
  @Roles(...ROLES_GESTION)
  crear(@CurrentUser() user: JwtPayload, @Body() dto: CrearAnimalDto) {
    return this.ganadoService.crear(user.tenantId as string, dto);
  }

  @Patch(':id')
  @Roles(...ROLES_GESTION)
  actualizar(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ActualizarAnimalDto,
  ) {
    return this.ganadoService.actualizar(user.tenantId as string, id, dto);
  }

  @Post(':id/baja')
  @Roles(...ROLES_GESTION)
  darBaja(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: DarBajaDto,
  ) {
    return this.ganadoService.darBaja(user.tenantId as string, id, dto, user.sub);
  }
}
