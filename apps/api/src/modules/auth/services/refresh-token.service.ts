import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AppConfigService } from '../../../config/app-config.service';
import { PrismaService } from '../../../prisma/prisma.service';

export interface IssuedRefreshToken {
  token: string;
  familiaId: string;
  expiraEn: Date;
}

export interface RotatedRefreshToken extends IssuedRefreshToken {
  usuarioId: string;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  private expiryDate(): Date {
    const days = this.config.refreshTokenExpiresInDays;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  async issue(usuarioId: string, familiaId: string = randomUUID()): Promise<IssuedRefreshToken> {
    const token = randomBytes(32).toString('hex');
    const expiraEn = this.expiryDate();

    await this.prisma.refreshToken.create({
      data: {
        usuarioId,
        tokenHash: hashToken(token),
        familiaId,
        expiraEn,
      },
    });

    return { token, familiaId, expiraEn };
  }

  // Valida y rota un refresh token. Si el token ya fue usado (revocado),
  // se interpreta como robo/reuse y se invalida toda la familia de sesión.
  async rotate(rawToken: string): Promise<RotatedRefreshToken> {
    const tokenHash = hashToken(rawToken);
    const existing = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!existing) {
      throw new UnauthorizedException('Sesión inválida');
    }

    if (existing.revocadoEn || existing.expiraEn < new Date()) {
      await this.prisma.refreshToken.updateMany({
        where: { familiaId: existing.familiaId, revocadoEn: null },
        data: { revocadoEn: new Date() },
      });
      throw new UnauthorizedException('Sesión inválida');
    }

    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revocadoEn: new Date() },
    });

    const issued = await this.issue(existing.usuarioId, existing.familiaId);
    return { ...issued, usuarioId: existing.usuarioId };
  }

  async revoke(rawToken: string): Promise<void> {
    const tokenHash = hashToken(rawToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revocadoEn: null },
      data: { revocadoEn: new Date() },
    });
  }

  async revokeAllForUser(usuarioId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { usuarioId, revocadoEn: null },
      data: { revocadoEn: new Date() },
    });
  }
}
