import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { CambiarRolDto } from './dto/cambiar-rol.dto';
import { CrearInvitacionDto } from './dto/crear-invitacion.dto';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles(RolUsuario.ADMIN_NEGOCIO)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  listar(@CurrentUser() user: JwtPayload) {
    return this.usuariosService.listar(user.tenantId as string);
  }

  @Post('invitaciones')
  invitar(@CurrentUser() user: JwtPayload, @Body() dto: CrearInvitacionDto) {
    return this.usuariosService.invitar(user.tenantId as string, dto, user.sub);
  }

  @Post('invitaciones/:id/reenviar')
  reenviarInvitacion(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.usuariosService.reenviarInvitacion(user.tenantId as string, id);
  }

  @Delete('invitaciones/:id')
  cancelarInvitacion(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.usuariosService.cancelarInvitacion(user.tenantId as string, id);
  }

  @Patch(':id/rol')
  cambiarRol(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: CambiarRolDto) {
    return this.usuariosService.cambiarRol(user.tenantId as string, id, dto);
  }

  @Patch(':id/desactivar')
  desactivar(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.usuariosService.desactivar(user.tenantId as string, id);
  }
}
