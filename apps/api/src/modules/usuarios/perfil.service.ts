import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PasswordService } from '../auth/services/password.service';
import { RefreshTokenService } from '../auth/services/refresh-token.service';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto';
import { CambiarPasswordDto } from './dto/cambiar-password.dto';

@Injectable()
export class PerfilService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async obtener(usuarioId: string) {
    const usuario = await this.prisma.usuario.findUniqueOrThrow({ where: { id: usuarioId } });
    return { id: usuario.id, email: usuario.email, nombre: usuario.nombre };
  }

  async actualizar(usuarioId: string, dto: ActualizarPerfilDto) {
    const usuario = await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { nombre: dto.nombre },
    });
    return { id: usuario.id, email: usuario.email, nombre: usuario.nombre };
  }

  // Revoca todas las sesiones (no solo "las demás"): no hay forma hoy de
  // identificar cuál refresh token corresponde a la sesión que originó el
  // cambio sin agregar tracking nuevo — mismo criterio ya usado en
  // AuthService.resetPassword, que fuerza re-login tras cambiar la clave.
  async cambiarPassword(usuarioId: string, dto: CambiarPasswordDto): Promise<void> {
    const usuario = await this.prisma.usuario.findUniqueOrThrow({ where: { id: usuarioId } });
    const passwordValida = await this.passwordService.verify(usuario.passwordHash, dto.passwordActual);
    if (!passwordValida) {
      throw new BadRequestException('La contraseña actual es incorrecta.');
    }

    const passwordHash = await this.passwordService.hash(dto.passwordNueva);
    await this.prisma.usuario.update({ where: { id: usuarioId }, data: { passwordHash } });
    await this.refreshTokenService.revokeAllForUser(usuarioId);
  }
}
