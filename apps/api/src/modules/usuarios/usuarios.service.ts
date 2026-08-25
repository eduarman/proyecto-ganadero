import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { generateOpaqueToken, hashOpaqueToken } from '../../common/opaque-token.util';
import { AppConfigService } from '../../config/app-config.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailSender } from '../auth/services/email-sender';
import { PasswordService } from '../auth/services/password.service';
import { RefreshTokenService } from '../auth/services/refresh-token.service';
import { AceptarInvitacionDto } from './dto/aceptar-invitacion.dto';
import { CambiarRolDto } from './dto/cambiar-rol.dto';
import { CrearInvitacionDto } from './dto/crear-invitacion.dto';

const INVITACION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class UsuariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly emailSender: EmailSender,
    private readonly config: AppConfigService,
  ) {}

  private async enviarEmailInvitacion(email: string, negocioNombre: string, rawToken: string): Promise<void> {
    await this.emailSender.send({
      to: email,
      subject: `Invitación a ${negocioNombre}`,
      body: `Te invitaron a sumarte a "${negocioNombre}" en AgroGanado.\nHacé click en el siguiente link para aceptar la invitación (válido por 7 días):\n${this.config.corsOrigin}/invitaciones/${rawToken}`,
    });
  }

  // Resuelve y valida un token de invitación recibido por email — usado tanto
  // por previsualizar como por aceptar. Si expiró, la marca EXPIRADA al vuelo
  // (mismo patrón "catch-up on-demand" usado en sanidad/reproducción).
  private async resolverInvitacionVigente(rawToken: string) {
    const tokenHash = hashOpaqueToken(rawToken);
    const invitacion = await this.prisma.invitacion.findUnique({ where: { tokenHash } });

    if (!invitacion || invitacion.estado !== 'PENDIENTE') {
      throw new BadRequestException({
        code: 'INVITACION_INVALIDA',
        message: 'La invitación es inválida o ya fue utilizada.',
      });
    }
    if (invitacion.expiraEn < new Date()) {
      await this.prisma.invitacion.update({ where: { id: invitacion.id }, data: { estado: 'EXPIRADA' } });
      throw new BadRequestException({
        code: 'INVITACION_EXPIRADA',
        message: 'La invitación expiró. Pedí que te reenvíen una nueva.',
      });
    }
    return invitacion;
  }

  private async obtenerInvitacionPendiente(tenantId: string, invitacionId: string) {
    const invitacion = await this.prisma.invitacion.findFirst({
      where: { id: invitacionId, negocioId: tenantId, estado: 'PENDIENTE' },
    });
    if (!invitacion) {
      throw new NotFoundException('Invitación no encontrada o ya no está pendiente.');
    }
    return invitacion;
  }

  // ADMIN_NEGOCIO nunca es un rol editable/desactivable acá: en v1 es siempre
  // el único administrador del negocio (la invitación excluye ese rol), así
  // que esta única regla cubre "no permitir autodesactivarse si es el único
  // admin" sin necesidad de contar administradores restantes.
  private async obtenerVinculoEditable(tenantId: string, usuarioObjetivoId: string) {
    const vinculo = await this.prisma.usuarioNegocio.findUnique({
      where: { usuarioId_negocioId: { usuarioId: usuarioObjetivoId, negocioId: tenantId } },
    });
    if (!vinculo) {
      throw new NotFoundException('Usuario no encontrado en este negocio.');
    }
    if (vinculo.rol === 'ADMIN_NEGOCIO') {
      throw new BadRequestException('El administrador del negocio no se puede editar desde acá.');
    }
    return vinculo;
  }

  async listar(tenantId: string) {
    const [negocio, usuarioNegocios, invitaciones] = await Promise.all([
      this.prisma.negocio.findUniqueOrThrow({
        where: { id: tenantId },
        include: { cuenta: { include: { plan: true } } },
      }),
      this.prisma.usuarioNegocio.findMany({
        where: { negocioId: tenantId },
        include: { usuario: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.invitacion.findMany({
        where: { negocioId: tenantId, estado: 'PENDIENTE' },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const ahora = new Date();
    const vencidas = invitaciones.filter((i) => i.expiraEn < ahora);
    if (vencidas.length > 0) {
      await this.prisma.invitacion.updateMany({
        where: { id: { in: vencidas.map((v) => v.id) } },
        data: { estado: 'EXPIRADA' },
      });
    }

    const activos = usuarioNegocios.filter((un) => un.activo).length;

    return {
      usuarios: usuarioNegocios.map((un) => ({
        id: un.usuario.id,
        nombre: un.usuario.nombre,
        email: un.usuario.email,
        rol: un.rol,
        activo: un.activo,
      })),
      invitacionesPendientes: invitaciones
        .filter((i) => i.expiraEn >= ahora)
        .map((i) => ({ id: i.id, email: i.email, rol: i.rol, expiraEn: i.expiraEn })),
      usoPlan: { actual: activos, limite: negocio.cuenta.plan.maxUsuarios },
    };
  }

  async invitar(tenantId: string, dto: CrearInvitacionDto, invitadoPorId: string) {
    const negocio = await this.prisma.negocio.findUniqueOrThrow({
      where: { id: tenantId },
      include: { cuenta: { include: { plan: true } } },
    });

    const activos = await this.prisma.usuarioNegocio.count({ where: { negocioId: tenantId, activo: true } });
    if (activos >= negocio.cuenta.plan.maxUsuarios) {
      throw new ForbiddenException({
        code: 'PLAN_LIMIT_REACHED',
        message: `Alcanzaste el límite de ${negocio.cuenta.plan.maxUsuarios} usuarios de tu plan.`,
      });
    }

    const [invitacionPendiente, usuarioExistente] = await Promise.all([
      this.prisma.invitacion.findFirst({ where: { negocioId: tenantId, email: dto.email, estado: 'PENDIENTE' } }),
      this.prisma.usuario.findUnique({ where: { email: dto.email } }),
    ]);
    if (invitacionPendiente) {
      throw new ConflictException('Ya hay una invitación pendiente para ese email.');
    }
    if (usuarioExistente) {
      const vinculoActivo = await this.prisma.usuarioNegocio.findFirst({
        where: { usuarioId: usuarioExistente.id, negocioId: tenantId, activo: true },
      });
      if (vinculoActivo) {
        throw new ConflictException('Ese usuario ya pertenece a este negocio.');
      }
    }

    const { raw, hash } = generateOpaqueToken();
    const invitacion = await this.prisma.invitacion.create({
      data: {
        email: dto.email,
        negocioId: tenantId,
        rol: dto.rol,
        tokenHash: hash,
        invitadoPorId,
        expiraEn: new Date(Date.now() + INVITACION_TTL_MS),
      },
    });

    await this.enviarEmailInvitacion(dto.email, negocio.nombre, raw);
    return invitacion;
  }

  async reenviarInvitacion(tenantId: string, invitacionId: string) {
    const invitacion = await this.obtenerInvitacionPendiente(tenantId, invitacionId);
    const { raw, hash } = generateOpaqueToken();

    await this.prisma.invitacion.update({
      where: { id: invitacion.id },
      data: { tokenHash: hash, expiraEn: new Date(Date.now() + INVITACION_TTL_MS) },
    });

    const negocio = await this.prisma.negocio.findUniqueOrThrow({ where: { id: tenantId } });
    await this.enviarEmailInvitacion(invitacion.email, negocio.nombre, raw);
  }

  async cancelarInvitacion(tenantId: string, invitacionId: string) {
    const invitacion = await this.obtenerInvitacionPendiente(tenantId, invitacionId);
    await this.prisma.invitacion.update({ where: { id: invitacion.id }, data: { estado: 'CANCELADA' } });
  }

  async previsualizarInvitacion(rawToken: string) {
    const invitacion = await this.resolverInvitacionVigente(rawToken);
    const [negocio, usuarioExistente] = await Promise.all([
      this.prisma.negocio.findUniqueOrThrow({ where: { id: invitacion.negocioId } }),
      this.prisma.usuario.findUnique({ where: { email: invitacion.email } }),
    ]);

    return {
      negocioNombre: negocio.nombre,
      rol: invitacion.rol,
      email: invitacion.email,
      usuarioExistente: !!usuarioExistente,
    };
  }

  async aceptarInvitacion(rawToken: string, dto: AceptarInvitacionDto): Promise<void> {
    const invitacion = await this.resolverInvitacionVigente(rawToken);
    const usuarioExistente = await this.prisma.usuario.findUnique({ where: { email: invitacion.email } });

    if (usuarioExistente) {
      const vinculo = await this.prisma.usuarioNegocio.findUnique({
        where: { usuarioId_negocioId: { usuarioId: usuarioExistente.id, negocioId: invitacion.negocioId } },
      });
      if (vinculo) {
        if (!vinculo.activo) {
          await this.prisma.usuarioNegocio.update({
            where: { id: vinculo.id },
            data: { activo: true, rol: invitacion.rol },
          });
        }
      } else {
        await this.prisma.usuarioNegocio.create({
          data: { usuarioId: usuarioExistente.id, negocioId: invitacion.negocioId, rol: invitacion.rol },
        });
      }
    } else {
      if (!dto.nombre || !dto.password) {
        throw new BadRequestException('Nombre y contraseña son obligatorios para crear tu cuenta.');
      }
      const negocio = await this.prisma.negocio.findUniqueOrThrow({ where: { id: invitacion.negocioId } });
      const passwordHash = await this.passwordService.hash(dto.password);

      const nuevoUsuario = await this.prisma.usuario.create({
        data: {
          email: invitacion.email,
          passwordHash,
          nombre: dto.nombre,
          cuentaId: negocio.cuentaId,
          ultimoNegocioId: negocio.id,
          emailVerificadoEn: new Date(),
        },
      });
      await this.prisma.usuarioNegocio.create({
        data: { usuarioId: nuevoUsuario.id, negocioId: invitacion.negocioId, rol: invitacion.rol },
      });
    }

    await this.prisma.invitacion.update({
      where: { id: invitacion.id },
      data: { estado: 'ACEPTADA', aceptadaEn: new Date() },
    });
  }

  async cambiarRol(tenantId: string, usuarioObjetivoId: string, dto: CambiarRolDto) {
    const vinculo = await this.obtenerVinculoEditable(tenantId, usuarioObjetivoId);
    return this.prisma.usuarioNegocio.update({ where: { id: vinculo.id }, data: { rol: dto.rol } });
  }

  async desactivar(tenantId: string, usuarioObjetivoId: string): Promise<void> {
    const vinculo = await this.obtenerVinculoEditable(tenantId, usuarioObjetivoId);
    await this.prisma.usuarioNegocio.update({ where: { id: vinculo.id }, data: { activo: false } });
    await this.refreshTokenService.revokeAllForUser(usuarioObjetivoId);
  }
}
