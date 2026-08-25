import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { AceptarInvitacionDto } from './dto/aceptar-invitacion.dto';
import { UsuariosService } from './usuarios.service';

// Rutas públicas: la autorización la da poseer el token recibido por email,
// no una sesión — por eso viven fuera de los guards de JwtAuthGuard/TenantGuard.
@Controller('invitaciones')
export class InvitacionesPublicasController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get(':token')
  previsualizar(@Param('token') token: string) {
    return this.usuariosService.previsualizarInvitacion(token);
  }

  @Post(':token/aceptar')
  @HttpCode(HttpStatus.OK)
  aceptar(@Param('token') token: string, @Body() dto: AceptarInvitacionDto) {
    return this.usuariosService.aceptarInvitacion(token, dto);
  }
}
