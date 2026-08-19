import { randomBytes, createHash } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EstadoCuenta, RolUsuario, Usuario } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RegistroDto } from './dto/registro.dto';
import { JwtPayload } from './jwt-payload.interface';
import { EmailSender } from './services/email-sender';
import { PasswordService } from './services/password.service';
import { RefreshTokenService } from './services/refresh-token.service';

const LOGIN_LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LOCKOUT_MAX_ATTEMPTS = 5;
const RECOVERY_TOKEN_TTL_MS = 30 * 60 * 1000;
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

// Plan asignado durante el período de prueba (subscriptions.md: "acceso
// equivalente a Plan 2"). Debe existir en la tabla `planes` (ver prisma/seed.ts).
const TRIAL_PLAN_NOMBRE = 'Plan 2';

const GENERIC_LOGIN_ERROR = 'Email o contraseña incorrectos';

type UsuarioNegociosList = { negocioId: string; rol: RolUsuario; negocio: { nombre: string } }[];

type UsuarioConNegocios = Usuario & {
  cuenta: { estado: EstadoCuenta };
  usuarioNegocios: UsuarioNegociosList;
};

type UsuarioConSoloNegocios = Usuario & {
  usuarioNegocios: UsuarioNegociosList;
};

function hashOpaqueToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function generateOpaqueToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('hex');
  return { raw, hash: hashOpaqueToken(raw) };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly jwtService: JwtService,
    private readonly emailSender: EmailSender,
  ) {}

  private resolveTenantContext(
    usuario: Pick<Usuario, 'ultimoNegocioId'>,
    negocios: UsuarioConNegocios['usuarioNegocios'],
  ): { tenantId: string | null; rol: RolUsuario | null } {
    if (negocios.length === 0) {
      return { tenantId: null, rol: null };
    }
    const activo =
      negocios.find((n) => n.negocioId === usuario.ultimoNegocioId) ?? negocios[0];
    return { tenantId: activo.negocioId, rol: activo.rol };
  }

  private isReadonly(estadoCuenta: EstadoCuenta): boolean {
    return estadoCuenta === EstadoCuenta.SUSPENDIDA || estadoCuenta === EstadoCuenta.CANCELADA;
  }

  private signAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload);
  }

  private async countRecentFailedAttempts(email: string): Promise<number> {
    return this.prisma.intentoLogin.count({
      where: {
        email,
        exitoso: false,
        createdAt: { gt: new Date(Date.now() - LOGIN_LOCKOUT_WINDOW_MS) },
      },
    });
  }

  private recordLoginAttempt(email: string, ip: string, exitoso: boolean): Promise<unknown> {
    return this.prisma.intentoLogin.create({ data: { email, ip, exitoso } });
  }

  async login(
    email: string,
    password: string,
    ip: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    usuario: { id: string; email: string; nombre: string };
    negocios: { id: string; nombre: string; rol: RolUsuario }[];
    negocioActivo: string | null;
  }> {
    const failedAttempts = await this.countRecentFailedAttempts(email);
    if (failedAttempts >= LOGIN_LOCKOUT_MAX_ATTEMPTS) {
      throw new ForbiddenException({
        code: 'ACCOUNT_LOCKED',
        message: 'Demasiados intentos fallidos. Intenta de nuevo en unos minutos.',
      });
    }

    const usuario = (await this.prisma.usuario.findUnique({
      where: { email },
      include: { cuenta: true, usuarioNegocios: { include: { negocio: true } } },
    })) as UsuarioConNegocios | null;

    if (!usuario) {
      await this.recordLoginAttempt(email, ip, false);
      throw new UnauthorizedException(GENERIC_LOGIN_ERROR);
    }

    const passwordValida = await this.passwordService.verify(usuario.passwordHash, password);
    if (!passwordValida) {
      await this.recordLoginAttempt(email, ip, false);
      if (failedAttempts + 1 >= LOGIN_LOCKOUT_MAX_ATTEMPTS) {
        await this.emailSender.send({
          to: usuario.email,
          subject: 'Bloqueo temporal por intentos fallidos',
          body: 'Detectamos varios intentos fallidos de inicio de sesión en tu cuenta. El acceso quedó bloqueado temporalmente por 15 minutos.',
        });
      }
      throw new UnauthorizedException(GENERIC_LOGIN_ERROR);
    }

    if (!usuario.emailVerificadoEn) {
      throw new ForbiddenException({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Debes verificar tu email antes de iniciar sesión.',
      });
    }

    await this.recordLoginAttempt(email, ip, true);

    const negocios = usuario.usuarioNegocios;
    const { tenantId, rol } = this.resolveTenantContext(usuario, negocios);
    const readonly = this.isReadonly(usuario.cuenta.estado);

    if (tenantId && tenantId !== usuario.ultimoNegocioId) {
      await this.prisma.usuario.update({
        where: { id: usuario.id },
        data: { ultimoNegocioId: tenantId },
      });
    }

    const accessToken = this.signAccessToken({ sub: usuario.id, tenantId, rol, readonly });
    const { token: refreshToken } = await this.refreshTokenService.issue(usuario.id);

    return {
      accessToken,
      refreshToken,
      usuario: { id: usuario.id, email: usuario.email, nombre: usuario.nombre },
      negocios: negocios.map((n) => ({ id: n.negocioId, nombre: n.negocio.nombre, rol: n.rol })),
      negocioActivo: tenantId,
    };
  }

  async registro(dto: RegistroDto): Promise<{ usuarioId: string; email: string }> {
    const existente = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
    if (existente) {
      throw new ConflictException({
        code: 'EMAIL_TAKEN',
        message: 'Ya existe una cuenta con ese email.',
      });
    }

    const trialPlan = await this.prisma.plan.findUnique({
      where: { nombre: TRIAL_PLAN_NOMBRE },
    });
    if (!trialPlan) {
      throw new InternalServerErrorException(
        `No se encontró el plan de trial ("${TRIAL_PLAN_NOMBRE}"). Ejecuta el seed de Prisma.`,
      );
    }

    const passwordHash = await this.passwordService.hash(dto.password);
    const fechaInicio = new Date();
    const fechaRenovacion = new Date(fechaInicio.getTime() + 14 * 24 * 60 * 60 * 1000);

    const usuario = await this.prisma.$transaction(async (tx) => {
      const cuenta = await tx.cuenta.create({
        data: {
          emailTitular: dto.email,
          planId: trialPlan.id,
          estado: EstadoCuenta.PERIODO_PRUEBA,
          fechaInicio,
          fechaRenovacion,
        },
      });

      const negocio = await tx.negocio.create({
        data: {
          cuentaId: cuenta.id,
          nombre: `Negocio de ${dto.nombre}`,
        },
      });

      const nuevoUsuario = await tx.usuario.create({
        data: {
          email: dto.email,
          passwordHash,
          nombre: dto.nombre,
          cuentaId: cuenta.id,
          ultimoNegocioId: negocio.id,
        },
      });

      await tx.usuarioNegocio.create({
        data: {
          usuarioId: nuevoUsuario.id,
          negocioId: negocio.id,
          rol: RolUsuario.ADMIN_NEGOCIO,
        },
      });

      return nuevoUsuario;
    });

    const { raw, hash } = generateOpaqueToken();
    await this.prisma.tokenVerificacionEmail.create({
      data: {
        usuarioId: usuario.id,
        tokenHash: hash,
        expiraEn: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
      },
    });
    await this.emailSender.send({
      to: usuario.email,
      subject: 'Verifica tu cuenta',
      body: `Tu token de verificación es: ${raw}`,
    });

    return { usuarioId: usuario.id, email: usuario.email };
  }

  async refresh(
    rawRefreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const rotated = await this.refreshTokenService.rotate(rawRefreshToken);

    const usuario = (await this.prisma.usuario.findUnique({
      where: { id: rotated.usuarioId },
      include: { cuenta: true, usuarioNegocios: { include: { negocio: true } } },
    })) as UsuarioConNegocios | null;

    if (!usuario) {
      throw new UnauthorizedException('Sesión inválida');
    }

    const { tenantId, rol } = this.resolveTenantContext(usuario, usuario.usuarioNegocios);
    const readonly = this.isReadonly(usuario.cuenta.estado);
    const accessToken = this.signAccessToken({ sub: usuario.id, tenantId, rol, readonly });

    return { accessToken, refreshToken: rotated.token };
  }

  async logout(rawRefreshToken: string): Promise<void> {
    await this.refreshTokenService.revoke(rawRefreshToken);
  }

  async logoutAll(usuarioId: string): Promise<void> {
    await this.refreshTokenService.revokeAllForUser(usuarioId);
  }

  async switchTenant(
    usuarioId: string,
    negocioId: string,
  ): Promise<{ accessToken: string }> {
    const membresia = await this.prisma.usuarioNegocio.findUnique({
      where: { usuarioId_negocioId: { usuarioId, negocioId } },
    });
    if (!membresia) {
      throw new ForbiddenException('No perteneces a ese negocio.');
    }

    const usuario = await this.prisma.usuario.findUniqueOrThrow({
      where: { id: usuarioId },
      include: { cuenta: true },
    });

    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { ultimoNegocioId: negocioId },
    });

    const accessToken = this.signAccessToken({
      sub: usuarioId,
      tenantId: negocioId,
      rol: membresia.rol,
      readonly: this.isReadonly(usuario.cuenta.estado),
    });

    return { accessToken };
  }

  async me(
    usuarioId: string,
    tenantId: string | null,
  ): Promise<{
    usuario: { id: string; email: string; nombre: string };
    negocios: { id: string; nombre: string; rol: RolUsuario }[];
    negocioActivo: { id: string; nombre: string; rol: RolUsuario } | null;
    permisos: string[];
  }> {
    const usuario = (await this.prisma.usuario.findUniqueOrThrow({
      where: { id: usuarioId },
      include: { usuarioNegocios: { include: { negocio: true } } },
    })) as UsuarioConSoloNegocios;

    const negocios = usuario.usuarioNegocios.map((n) => ({
      id: n.negocioId,
      nombre: n.negocio.nombre,
      rol: n.rol,
    }));

    return {
      usuario: { id: usuario.id, email: usuario.email, nombre: usuario.nombre },
      negocios,
      negocioActivo: negocios.find((n) => n.id === tenantId) ?? null,
      // TODO(usuarios-roles): resolver contra el catálogo permisos/rol_permisos.
      permisos: [],
    };
  }

  async recuperarPassword(email: string): Promise<void> {
    const usuario = await this.prisma.usuario.findUnique({ where: { email } });
    if (usuario) {
      const { raw, hash } = generateOpaqueToken();
      await this.prisma.tokenRecuperacion.create({
        data: {
          usuarioId: usuario.id,
          tokenHash: hash,
          expiraEn: new Date(Date.now() + RECOVERY_TOKEN_TTL_MS),
        },
      });
      await this.emailSender.send({
        to: usuario.email,
        subject: 'Recuperación de contraseña',
        body: `Tu token de recuperación es: ${raw} (válido por 30 minutos)`,
      });
    }
    // Mensaje de éxito siempre igual, exista o no el email (anti-enumeración).
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const tokenHash = hashOpaqueToken(rawToken);
    const registro = await this.prisma.tokenRecuperacion.findUnique({ where: { tokenHash } });

    if (!registro || registro.usadoEn || registro.expiraEn < new Date()) {
      throw new BadRequestException({
        code: 'TOKEN_INVALID',
        message: 'El token de recuperación es inválido o expiró.',
      });
    }

    const passwordHash = await this.passwordService.hash(newPassword);

    await this.prisma.$transaction([
      this.prisma.usuario.update({
        where: { id: registro.usuarioId },
        data: { passwordHash },
      }),
      this.prisma.tokenRecuperacion.update({
        where: { id: registro.id },
        data: { usadoEn: new Date() },
      }),
    ]);

    await this.refreshTokenService.revokeAllForUser(registro.usuarioId);

    const usuario = await this.prisma.usuario.findUnique({ where: { id: registro.usuarioId } });
    if (usuario) {
      await this.emailSender.send({
        to: usuario.email,
        subject: 'Tu contraseña fue actualizada',
        body: 'Tu contraseña fue cambiada exitosamente. Si no fuiste tú, contacta a soporte.',
      });
    }
  }

  async verificarEmail(rawToken: string): Promise<void> {
    const tokenHash = hashOpaqueToken(rawToken);
    const registro = await this.prisma.tokenVerificacionEmail.findUnique({
      where: { tokenHash },
    });

    if (!registro || registro.usadoEn || registro.expiraEn < new Date()) {
      throw new BadRequestException({
        code: 'TOKEN_INVALID',
        message: 'El token de verificación es inválido o expiró.',
      });
    }

    await this.prisma.$transaction([
      this.prisma.usuario.update({
        where: { id: registro.usuarioId },
        data: { emailVerificadoEn: new Date() },
      }),
      this.prisma.tokenVerificacionEmail.update({
        where: { id: registro.id },
        data: { usadoEn: new Date() },
      }),
    ]);
  }

  async reenviarVerificacion(email: string): Promise<void> {
    const usuario = await this.prisma.usuario.findUnique({ where: { email } });
    if (usuario && !usuario.emailVerificadoEn) {
      const { raw, hash } = generateOpaqueToken();
      await this.prisma.tokenVerificacionEmail.create({
        data: {
          usuarioId: usuario.id,
          tokenHash: hash,
          expiraEn: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
        },
      });
      await this.emailSender.send({
        to: usuario.email,
        subject: 'Verifica tu cuenta',
        body: `Tu token de verificación es: ${raw}`,
      });
    }
    // Mensaje de éxito siempre igual, evita enumeración de usuarios.
  }
}
