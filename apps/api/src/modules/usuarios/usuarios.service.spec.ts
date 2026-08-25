import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';

function buildDeps() {
  const prisma = {
    negocio: { findUniqueOrThrow: jest.fn() },
    usuario: { findUnique: jest.fn(), create: jest.fn() },
    usuarioNegocio: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    invitacion: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const passwordService = { hash: jest.fn().mockResolvedValue('hashed'), verify: jest.fn() };
  const refreshTokenService = { revokeAllForUser: jest.fn() };
  const emailSender = { send: jest.fn().mockResolvedValue(undefined) };
  const config = { corsOrigin: 'http://localhost:5173' };

  const service = new UsuariosService(
    prisma as any,
    passwordService as any,
    refreshTokenService as any,
    emailSender as any,
    config as any,
  );

  return { service, prisma, passwordService, refreshTokenService, emailSender };
}

const TENANT_A = 'negocio-a';
const negocioConPlan = (maxUsuarios: number) => ({
  id: TENANT_A,
  nombre: 'Finca 1',
  cuentaId: 'cuenta-1',
  cuenta: { plan: { maxUsuarios } },
});

describe('UsuariosService.invitar', () => {
  const dto = { email: 'nuevo@test.com', rol: 'OPERARIO' as const };

  it('rechaza con 403 PLAN_LIMIT_REACHED si ya se alcanzó el límite del plan', async () => {
    const { service, prisma } = buildDeps();
    prisma.negocio.findUniqueOrThrow.mockResolvedValue(negocioConPlan(2));
    prisma.usuarioNegocio.count.mockResolvedValue(2);

    await expect(service.invitar(TENANT_A, dto, 'admin-1')).rejects.toThrow(ForbiddenException);
    expect(prisma.invitacion.create).not.toHaveBeenCalled();
  });

  it('rechaza con 409 si ya hay una invitación pendiente para ese email', async () => {
    const { service, prisma } = buildDeps();
    prisma.negocio.findUniqueOrThrow.mockResolvedValue(negocioConPlan(10));
    prisma.usuarioNegocio.count.mockResolvedValue(1);
    prisma.invitacion.findFirst.mockResolvedValue({ id: 'inv-1' });
    prisma.usuario.findUnique.mockResolvedValue(null);

    await expect(service.invitar(TENANT_A, dto, 'admin-1')).rejects.toThrow(ConflictException);
    expect(prisma.invitacion.create).not.toHaveBeenCalled();
  });

  it('rechaza con 409 si el email ya pertenece activamente a este negocio', async () => {
    const { service, prisma } = buildDeps();
    prisma.negocio.findUniqueOrThrow.mockResolvedValue(negocioConPlan(10));
    prisma.usuarioNegocio.count.mockResolvedValue(1);
    prisma.invitacion.findFirst.mockResolvedValue(null);
    prisma.usuario.findUnique.mockResolvedValue({ id: 'user-existente' });
    prisma.usuarioNegocio.findFirst.mockResolvedValue({ id: 'vinculo-1', activo: true });

    await expect(service.invitar(TENANT_A, dto, 'admin-1')).rejects.toThrow(ConflictException);
    expect(prisma.invitacion.create).not.toHaveBeenCalled();
  });

  it('crea la invitación y envía el email cuando no hay conflictos', async () => {
    const { service, prisma, emailSender } = buildDeps();
    prisma.negocio.findUniqueOrThrow.mockResolvedValue(negocioConPlan(10));
    prisma.usuarioNegocio.count.mockResolvedValue(1);
    prisma.invitacion.findFirst.mockResolvedValue(null);
    prisma.usuario.findUnique.mockResolvedValue(null);
    prisma.invitacion.create.mockResolvedValue({ id: 'inv-nueva', email: dto.email, rol: dto.rol });

    const resultado = await service.invitar(TENANT_A, dto, 'admin-1');

    expect(resultado.id).toBe('inv-nueva');
    expect(prisma.invitacion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: dto.email, rol: dto.rol, negocioId: TENANT_A, invitadoPorId: 'admin-1' }),
      }),
    );
    expect(emailSender.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: dto.email, subject: expect.stringContaining('Finca 1') }),
    );
  });
});

describe('UsuariosService.aceptarInvitacion', () => {
  const invitacionVigente = {
    id: 'inv-1',
    email: 'invitado@test.com',
    negocioId: TENANT_A,
    rol: 'OPERARIO',
    estado: 'PENDIENTE',
    expiraEn: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };

  it('rechaza con 400 si el token no existe o ya fue usado', async () => {
    const { service, prisma } = buildDeps();
    prisma.invitacion.findUnique.mockResolvedValue(null);

    await expect(service.aceptarInvitacion('token-x', {})).rejects.toThrow(BadRequestException);
  });

  it('rechaza con 400 si el token expiró (y lo marca EXPIRADA)', async () => {
    const { service, prisma } = buildDeps();
    prisma.invitacion.findUnique.mockResolvedValue({ ...invitacionVigente, expiraEn: new Date('2020-01-01') });

    await expect(service.aceptarInvitacion('token-x', {})).rejects.toThrow(BadRequestException);
    expect(prisma.invitacion.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { estado: 'EXPIRADA' } }),
    );
  });

  it('usuario nuevo: exige nombre y password, crea Usuario y UsuarioNegocio', async () => {
    const { service, prisma } = buildDeps();
    prisma.invitacion.findUnique.mockResolvedValue(invitacionVigente);
    prisma.usuario.findUnique.mockResolvedValue(null);

    await expect(service.aceptarInvitacion('token-x', {})).rejects.toThrow(BadRequestException);
    expect(prisma.usuario.create).not.toHaveBeenCalled();

    prisma.negocio.findUniqueOrThrow.mockResolvedValue({ id: TENANT_A, nombre: 'Finca 1', cuentaId: 'cuenta-1' });
    prisma.usuario.create.mockResolvedValue({ id: 'user-nuevo' });

    await service.aceptarInvitacion('token-x', { nombre: 'Nuevo', password: 'Passw0rd' });

    expect(prisma.usuario.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ email: invitacionVigente.email, cuentaId: 'cuenta-1' }) }),
    );
    expect(prisma.usuarioNegocio.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { usuarioId: 'user-nuevo', negocioId: TENANT_A, rol: 'OPERARIO' } }),
    );
    expect(prisma.invitacion.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ estado: 'ACEPTADA' }) }),
    );
  });

  it('usuario existente: vincula sin pedir password', async () => {
    const { service, prisma } = buildDeps();
    prisma.invitacion.findUnique.mockResolvedValue(invitacionVigente);
    prisma.usuario.findUnique.mockResolvedValue({ id: 'user-existente' });
    prisma.usuarioNegocio.findUnique.mockResolvedValue(null);

    await service.aceptarInvitacion('token-x', {});

    expect(prisma.usuario.create).not.toHaveBeenCalled();
    expect(prisma.usuarioNegocio.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { usuarioId: 'user-existente', negocioId: TENANT_A, rol: 'OPERARIO' } }),
    );
  });
});

describe('UsuariosService.cambiarRol / desactivar', () => {
  it('cambiarRol rechaza con 400 si el usuario objetivo es ADMIN_NEGOCIO', async () => {
    const { service, prisma } = buildDeps();
    prisma.usuarioNegocio.findUnique.mockResolvedValue({ id: 'vinculo-1', rol: 'ADMIN_NEGOCIO' });

    await expect(service.cambiarRol(TENANT_A, 'admin-1', { rol: 'OPERARIO' } as any)).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.usuarioNegocio.update).not.toHaveBeenCalled();
  });

  it('cambiarRol lanza 404 si el usuario no pertenece a este negocio', async () => {
    const { service, prisma } = buildDeps();
    prisma.usuarioNegocio.findUnique.mockResolvedValue(null);

    await expect(service.cambiarRol(TENANT_A, 'user-x', { rol: 'OPERARIO' } as any)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('cambiarRol actualiza el rol para un usuario no-admin', async () => {
    const { service, prisma } = buildDeps();
    prisma.usuarioNegocio.findUnique.mockResolvedValue({ id: 'vinculo-1', rol: 'OPERARIO' });
    prisma.usuarioNegocio.update.mockResolvedValue({ id: 'vinculo-1', rol: 'MAYORDOMO' });

    await service.cambiarRol(TENANT_A, 'user-1', { rol: 'MAYORDOMO' } as any);

    expect(prisma.usuarioNegocio.update).toHaveBeenCalledWith({
      where: { id: 'vinculo-1' },
      data: { rol: 'MAYORDOMO' },
    });
  });

  it('desactivar rechaza con 400 si el usuario objetivo es ADMIN_NEGOCIO', async () => {
    const { service, prisma, refreshTokenService } = buildDeps();
    prisma.usuarioNegocio.findUnique.mockResolvedValue({ id: 'vinculo-1', rol: 'ADMIN_NEGOCIO' });

    await expect(service.desactivar(TENANT_A, 'admin-1')).rejects.toThrow(BadRequestException);
    expect(refreshTokenService.revokeAllForUser).not.toHaveBeenCalled();
  });

  it('desactivar apaga el vínculo y revoca las sesiones del usuario', async () => {
    const { service, prisma, refreshTokenService } = buildDeps();
    prisma.usuarioNegocio.findUnique.mockResolvedValue({ id: 'vinculo-1', rol: 'OPERARIO' });

    await service.desactivar(TENANT_A, 'user-1');

    expect(prisma.usuarioNegocio.update).toHaveBeenCalledWith({
      where: { id: 'vinculo-1' },
      data: { activo: false },
    });
    expect(refreshTokenService.revokeAllForUser).toHaveBeenCalledWith('user-1');
  });
});
