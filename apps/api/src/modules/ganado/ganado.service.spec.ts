import { ConflictException, NotFoundException } from '@nestjs/common';
import { Especie, SexoAnimal } from '@prisma/client';
import { GanadoService } from './ganado.service';

function buildDeps() {
  const prisma = {
    animal: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    animalBaja: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const service = new GanadoService(prisma as any);
  return { service, prisma };
}

const TENANT_A = 'tenant-a';
const TENANT_B = 'tenant-b';

describe('GanadoService.crear', () => {
  it('rechaza con 409 si el identificador ya existe en el mismo tenant', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findUnique.mockResolvedValue({ id: 'existing', identificador: '001' });

    await expect(
      service.crear(TENANT_A, {
        identificador: '001',
        especie: Especie.BOVINO,
        sexo: SexoAnimal.HEMBRA,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('calcula la categoría etaria sugerida cuando no viene explícita', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findUnique.mockResolvedValue(null);
    prisma.animal.create.mockResolvedValue({ id: 'new' });

    await service.crear(TENANT_A, {
      identificador: '002',
      especie: Especie.BOVINO,
      sexo: SexoAnimal.MACHO,
      fechaNacimiento: '2026-01-01',
    });

    expect(prisma.animal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tenantId: TENANT_A, categoria: expect.any(String) }),
      }),
    );
  });

  it('respeta una categoría explícita en vez de la sugerida', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findUnique.mockResolvedValue(null);
    prisma.animal.create.mockResolvedValue({ id: 'new' });

    await service.crear(TENANT_A, {
      identificador: '003',
      especie: Especie.BOVINO,
      sexo: SexoAnimal.MACHO,
      categoria: 'Toro reproductor',
    });

    expect(prisma.animal.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ categoria: 'Toro reproductor' }) }),
    );
  });
});

describe('GanadoService.listar', () => {
  it('filtra siempre por tenantId, incluso con otros filtros vacíos', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findMany.mockResolvedValue([]);
    prisma.animal.count.mockResolvedValue(0);

    await service.listar(TENANT_B, { page: 1, limit: 20 });

    expect(prisma.animal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: TENANT_B } }),
    );
  });
});

describe('GanadoService.obtener', () => {
  it('lanza 404 si el animal no existe o pertenece a otro tenant', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findFirst.mockResolvedValue(null);

    await expect(service.obtener(TENANT_A, 'algun-id')).rejects.toThrow(NotFoundException);
    expect(prisma.animal.findFirst).toHaveBeenCalledWith({
      where: { id: 'algun-id', tenantId: TENANT_A },
    });
  });
});

describe('GanadoService.darBaja', () => {
  it('marca estado=INACTIVO y crea el registro de baja dentro de una transacción', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findFirst.mockResolvedValue({ id: 'animal-1' });
    prisma.$transaction.mockResolvedValue([{ id: 'animal-1' }, { id: 'baja-1' }]);

    const resultado = await service.darBaja(
      TENANT_A,
      'animal-1',
      { motivo: 'VENTA', fecha: '2026-08-20' },
      'usuario-1',
    );

    expect(resultado).toEqual({ id: 'baja-1' });
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
