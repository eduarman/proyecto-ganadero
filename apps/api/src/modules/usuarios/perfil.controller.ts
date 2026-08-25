import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto';
import { CambiarPasswordDto } from './dto/cambiar-password.dto';
import { PerfilService } from './perfil.service';

// Sin TenantGuard: un usuario sin negocio activo (recién invitado, o cuyo
// único negocio fue desactivado) debe poder ver/editar su perfil igual.
@Controller('perfil')
@UseGuards(JwtAuthGuard)
export class PerfilController {
  constructor(private readonly perfilService: PerfilService) {}

  @Get()
  obtener(@CurrentUser() user: JwtPayload) {
    return this.perfilService.obtener(user.sub);
  }

  @Patch()
  actualizar(@CurrentUser() user: JwtPayload, @Body() dto: ActualizarPerfilDto) {
    return this.perfilService.actualizar(user.sub, dto);
  }

  @Patch('password')
  cambiarPassword(@CurrentUser() user: JwtPayload, @Body() dto: CambiarPasswordDto) {
    return this.perfilService.cambiarPassword(user.sub, dto);
  }
}
