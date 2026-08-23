import { ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { EstadoCuenta, RolUsuario } from '@prisma/client';
import { AuthService } from './auth.service';

function buildDeps() {
  const prisma = {
    usuario: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
    },
    usuarioNegocio: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    intentoLogin: {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue(undefined),
    },
    plan: {
      findUnique: jest.fn(),
    },
    cuenta: { create: jest.fn() },
    negocio: { create: jest.fn() },
    tokenVerificacionEmail: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    tokenRecuperacion: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(),
  };

  const passwordService = {
    hash: jest.fn().mockResolvedValue('hashed'),
    verify: jest.fn(),
  };

  const refreshTokenService = {
    issue: jest.fn().mockResolvedValue({ token: 'raw-refresh-token', familiaId: 'fam-1' }),
    rotate: jest.fn(),
    revoke: jest.fn(),
    revokeAllForUser: jest.fn(),
  };

  const jwtService = {
    sign: jest.fn().mockReturnValue('signed.jwt.token'),
  };

  const emailSender = {
    send: jest.fn().mockResolvedValue(undefined),
  };

  const config = { corsOrigin: 'http://localhost:5173' };

  const service = new AuthService(
    prisma as any,
    passwordService as any,
    refreshTokenService as any,
    jwtService as any,
    emailSender as any,
    config as any,
  );

  return { service, prisma, passwordService, refreshTokenService, jwtService, emailSender };
}

const usuarioBase = {
  id: 'user-1',
  email: 'user@example.com',
  passwordHash: 'hashed',
  nombre: 'Marcos',
  emailVerificadoEn: new Date('2026-01-01'),
  ultimoNegocioId: 'negocio-1',
  cuenta: { estado: EstadoCuenta.ACTIVA },
  usuarioNegocios: [
    { negocioId: 'negocio-1', rol: RolUsuario.ADMIN_NEGOCIO, negocio: { nombre: 'Finca 1' } },
  ],
};

describe('AuthService.login', () => {
  it('devuelve tokens y contexto de tenant en credenciales válidas', async () => {
    const { service, prisma, passwordService } = buildDeps();
    prisma.usuario.findUnique.mockResolvedValue(usuarioBase);
    passwordService.verify.mockResolvedValue(true);

    const result = await service.login('user@example.com', 'Password1', '127.0.0.1');

    expect(result.accessToken).toBe('signed.jwt.token');
    expect(result.refreshToken).toBe('raw-refresh-token');
    expect(result.negocioActivo).toBe('negocio-1');
    expect(prisma.intentoLogin.create).toHaveBeenCalledWith({
      data: { email: 'user@example.com', ip: '127.0.0.1', exitoso: true },
    });
  });

  it('rechaza con mensaje genérico si el usuario no existe', async () => {
    const { service, prisma } = buildDeps();
    prisma.usuario.findUnique.mockResolvedValue(null);

    await expect(service.login('nadie@example.com', 'x', '127.0.0.1')).rejects.toThrow(
      UnauthorizedException,
    );
    await expect(service.login('nadie@example.com', 'x', '127.0.0.1')).rejects.toThrow(
      'Email o contraseña incorrectos',
    );
  });

  it('rechaza con el mismo mensaje genérico si la contraseña es incorrecta', async () => {
    const { service, prisma, passwordService } = buildDeps();
    prisma.usuario.findUnique.mockResolvedValue(usuarioBase);
    passwordService.verify.mockResolvedValue(false);

    await expect(service.login('user@example.com', 'mala', '127.0.0.1')).rejects.toThrow(
      'Email o contraseña incorrectos',
    );
  });

  it('bloquea el login tras 5 intentos fallidos en 15 minutos', async () => {
    const { service, prisma } = buildDeps();
    prisma.intentoLogin.count.mockResolvedValue(5);

    await expect(service.login('user@example.com', 'x', '127.0.0.1')).rejects.toThrow(
      ForbiddenException,
    );
    expect(prisma.usuario.findUnique).not.toHaveBeenCalled();
  });

  it('bloquea con EMAIL_NOT_VERIFIED si el email no está verificado', async () => {
    const { service, prisma, passwordService } = buildDeps();
    prisma.usuario.findUnique.mockResolvedValue({ ...usuarioBase, emailVerificadoEn: null });
    passwordService.verify.mockResolvedValue(true);

    await expect(service.login('user@example.com', 'Password1', '127.0.0.1')).rejects.toMatchObject(
      { response: { code: 'EMAIL_NOT_VERIFIED' } },
    );
  });

  it('marca readonly=true cuando la cuenta está suspendida', async () => {
    const { service, prisma, passwordService, jwtService } = buildDeps();
    prisma.usuario.findUnique.mockResolvedValue({
      ...usuarioBase,
      cuenta: { estado: EstadoCuenta.SUSPENDIDA },
    });
    passwordService.verify.mockResolvedValue(true);

    await service.login('user@example.com', 'Password1', '127.0.0.1');

    expect(jwtService.sign).toHaveBeenCalledWith(
      expect.objectContaining({ readonly: true }),
    );
  });
});

describe('AuthService.registro', () => {
  it('rechaza con 409 si el email ya existe', async () => {
    const { service, prisma } = buildDeps();
    prisma.usuario.findUnique.mockResolvedValue(usuarioBase);

    await expect(
      service.registro({ email: 'user@example.com', password: 'Password1', nombre: 'Marcos' }),
    ).rejects.toThrow(ConflictException);
  });

  it('crea cuenta+negocio+usuario+rol en una transacción y envía email de verificación', async () => {
    const { service, prisma, emailSender } = buildDeps();
    prisma.usuario.findUnique.mockResolvedValue(null);
    prisma.plan.findUnique.mockResolvedValue({ id: 'plan-2', nombre: 'Plan 2' });

    const tx = {
      cuenta: { create: jest.fn().mockResolvedValue({ id: 'cuenta-1' }) },
      negocio: { create: jest.fn().mockResolvedValue({ id: 'negocio-1' }) },
      usuario: {
        create: jest.fn().mockResolvedValue({ id: 'user-1', email: 'nuevo@example.com' }),
      },
      usuarioNegocio: { create: jest.fn().mockResolvedValue({}) },
    };
    prisma.$transaction.mockImplementation((fn: any) => fn(tx));

    const result = await service.registro({
      email: 'nuevo@example.com',
      password: 'Password1',
      nombre: 'Marcos',
    });

    expect(result).toEqual({ usuarioId: 'user-1', email: 'nuevo@example.com' });
    expect(tx.usuarioNegocio.create).toHaveBeenCalledWith({
      data: { usuarioId: 'user-1', negocioId: 'negocio-1', rol: RolUsuario.ADMIN_NEGOCIO },
    });
    expect(emailSender.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'nuevo@example.com', subject: 'Verifica tu cuenta' }),
    );
  });
});

describe('AuthService.refresh', () => {
  it('propaga el 401 cuando refreshTokenService detecta reuse', async () => {
    const { service, refreshTokenService } = buildDeps();
    refreshTokenService.rotate.mockRejectedValue(new UnauthorizedException('Sesión inválida'));

    await expect(service.refresh('token-robado')).rejects.toThrow(UnauthorizedException);
  });
});
