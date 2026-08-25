import { BadRequestException } from '@nestjs/common';
import { PerfilService } from './perfil.service';

function buildDeps() {
  const prisma = {
    usuario: { findUniqueOrThrow: jest.fn(), update: jest.fn() },
  };
  const passwordService = { hash: jest.fn().mockResolvedValue('hashed-nueva'), verify: jest.fn() };
  const refreshTokenService = { revokeAllForUser: jest.fn() };

  const service = new PerfilService(prisma as any, passwordService as any, refreshTokenService as any);
  return { service, prisma, passwordService, refreshTokenService };
}

describe('PerfilService.actualizar', () => {
  it('actualiza el nombre del usuario', async () => {
    const { service, prisma } = buildDeps();
    prisma.usuario.update.mockResolvedValue({ id: 'user-1', email: 'a@test.com', nombre: 'Nuevo Nombre' });

    const resultado = await service.actualizar('user-1', { nombre: 'Nuevo Nombre' });

    expect(prisma.usuario.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { nombre: 'Nuevo Nombre' },
    });
    expect(resultado.nombre).toBe('Nuevo Nombre');
  });
});

describe('PerfilService.cambiarPassword', () => {
  const dto = { passwordActual: 'Actual123', passwordNueva: 'Nueva456X' };

  it('rechaza con 400 si la contraseña actual es incorrecta', async () => {
    const { service, prisma, passwordService, refreshTokenService } = buildDeps();
    prisma.usuario.findUniqueOrThrow.mockResolvedValue({ id: 'user-1', passwordHash: 'hash-viejo' });
    passwordService.verify.mockResolvedValue(false);

    await expect(service.cambiarPassword('user-1', dto)).rejects.toThrow(BadRequestException);
    expect(prisma.usuario.update).not.toHaveBeenCalled();
    expect(refreshTokenService.revokeAllForUser).not.toHaveBeenCalled();
  });

  it('actualiza el hash y revoca todas las sesiones cuando la actual es correcta', async () => {
    const { service, prisma, passwordService, refreshTokenService } = buildDeps();
    prisma.usuario.findUniqueOrThrow.mockResolvedValue({ id: 'user-1', passwordHash: 'hash-viejo' });
    passwordService.verify.mockResolvedValue(true);

    await service.cambiarPassword('user-1', dto);

    expect(prisma.usuario.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { passwordHash: 'hashed-nueva' },
    });
    expect(refreshTokenService.revokeAllForUser).toHaveBeenCalledWith('user-1');
  });
});
