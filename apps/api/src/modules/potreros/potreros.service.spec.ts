import { ConflictException, NotFoundException } from '@nestjs/common';
import { PotrerosService } from './potreros.service';

function buildDeps() {
  const prisma = {
    potrero: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    animal: {
      count: jest.fn(),
    },
    animalMovimiento: {
      findMany: jest.fn(),
    },
  };

  const service = new PotrerosService(prisma as any);
  return { service, prisma };
}

const TENANT_A = 'tenant-a';

describe('PotrerosService.crear', () => {
  it('rechaza con 409 si el nombre ya existe en el mismo tenant', async () => {
    const { service, prisma } = buildDeps();
    prisma.potrero.findUnique.mockResolvedValue({ id: 'existing', nombre: 'Potrero 1' });

    await expect(
      service.crear(TENANT_A, { nombre: 'Potrero 1', areaHectareas: 10 }),
    ).rejects.toThrow(ConflictException);
  });
});

describe('PotrerosService.listar', () => {
  it('incluye la ocupación actual (animales activos asignados) por potrero', async () => {
    const { service, prisma } = buildDeps();
    prisma.potrero.findMany.mockResolvedValue([{ id: 'p1', nombre: 'Potrero 1' }]);
    prisma.animal.count.mockResolvedValue(3);

    const resultado = await service.listar(TENANT_A);

    expect(resultado).toEqual([{ id: 'p1', nombre: 'Potrero 1', ocupacionActual: 3 }]);
    expect(prisma.animal.count).toHaveBeenCalledWith({
      where: { potreroActualId: 'p1', estado: 'ACTIVO' },
    });
  });
});

describe('PotrerosService.obtener', () => {
  it('lanza 404 si el potrero no existe o pertenece a otro tenant', async () => {
    const { service, prisma } = buildDeps();
    prisma.potrero.findFirst.mockResolvedValue(null);

    await expect(service.obtener(TENANT_A, 'algun-id')).rejects.toThrow(NotFoundException);
  });
});

describe('PotrerosService.inactivar', () => {
  it('rechaza con 409 si el potrero tiene animales activos asignados', async () => {
    const { service, prisma } = buildDeps();
    prisma.potrero.findFirst.mockResolvedValue({ id: 'p1' });
    prisma.animal.count.mockResolvedValue(2);

    await expect(service.inactivar(TENANT_A, 'p1')).rejects.toThrow(ConflictException);
    expect(prisma.potrero.update).not.toHaveBeenCalled();
  });

  it('inactiva el potrero cuando no tiene animales asignados', async () => {
    const { service, prisma } = buildDeps();
    prisma.potrero.findFirst.mockResolvedValue({ id: 'p1' });
    prisma.animal.count.mockResolvedValue(0);
    prisma.potrero.update.mockResolvedValue({ id: 'p1', estado: 'INACTIVO' });

    const resultado = await service.inactivar(TENANT_A, 'p1');

    expect(resultado).toEqual({ id: 'p1', estado: 'INACTIVO' });
    expect(prisma.potrero.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { estado: 'INACTIVO' },
    });
  });
});

describe('PotrerosService.activar', () => {
  it('reactiva un potrero inactivo', async () => {
    const { service, prisma } = buildDeps();
    prisma.potrero.findFirst.mockResolvedValue({ id: 'p1', estado: 'INACTIVO' });
    prisma.animal.count.mockResolvedValue(0);
    prisma.potrero.update.mockResolvedValue({ id: 'p1', estado: 'ACTIVO' });

    const resultado = await service.activar(TENANT_A, 'p1');

    expect(resultado).toEqual({ id: 'p1', estado: 'ACTIVO' });
    expect(prisma.potrero.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { estado: 'ACTIVO' },
    });
  });
});

describe('PotrerosService.movimientos', () => {
  it('trae los movimientos donde el potrero es origen o destino (US-5.2)', async () => {
    const { service, prisma } = buildDeps();
    prisma.potrero.findFirst.mockResolvedValue({ id: 'p1' });
    prisma.animal.count.mockResolvedValue(0);
    prisma.animalMovimiento.findMany.mockResolvedValue([{ id: 'mov-1' }]);

    const resultado = await service.movimientos(TENANT_A, 'p1');

    expect(resultado).toEqual([{ id: 'mov-1' }]);
    expect(prisma.animalMovimiento.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: TENANT_A, OR: [{ potreroOrigenId: 'p1' }, { potreroDestinoId: 'p1' }] },
      }),
    );
  });
});
