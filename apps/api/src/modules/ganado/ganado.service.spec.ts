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
    servicio: {
      findFirst: jest.fn(),
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

  it('filtra por potrero actual cuando se indica', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findMany.mockResolvedValue([]);
    prisma.animal.count.mockResolvedValue(0);

    await service.listar(TENANT_A, { page: 1, limit: 20, potreroActualId: 'potrero-1' });

    expect(prisma.animal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ potreroActualId: 'potrero-1' }) }),
    );
  });

  it('traduce el rango de edad en meses a un rango de fechaNacimiento', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findMany.mockResolvedValue([]);
    prisma.animal.count.mockResolvedValue(0);

    await service.listar(TENANT_A, { page: 1, limit: 20, edadMinMeses: 12, edadMaxMeses: 24 });

    const llamada = prisma.animal.findMany.mock.calls[0][0];
    expect(llamada.where.fechaNacimiento.gte).toBeInstanceOf(Date);
    expect(llamada.where.fechaNacimiento.lte).toBeInstanceOf(Date);
    // edadMinMeses (12) -> nació antes que edadMaxMeses (24) -> nació después
    expect(llamada.where.fechaNacimiento.gte.getTime()).toBeLessThan(llamada.where.fechaNacimiento.lte.getTime());
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
    prisma.servicio.findFirst.mockResolvedValue(null);
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

  it('rechaza con 409 si el animal tiene un servicio reproductivo sin cerrar (US-4.3)', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findFirst.mockResolvedValue({ id: 'animal-1' });
    prisma.servicio.findFirst.mockResolvedValue({ id: 'servicio-1' });

    await expect(
      service.darBaja(TENANT_A, 'animal-1', { motivo: 'VENTA', fecha: '2026-08-20' }, 'usuario-1'),
    ).rejects.toThrow(ConflictException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('permite confirmar la baja igual con confirmarConEventosPendientes, sin volver a chequear', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findFirst.mockResolvedValue({ id: 'animal-1' });
    prisma.$transaction.mockResolvedValue([{ id: 'animal-1' }, { id: 'baja-1' }]);

    await service.darBaja(
      TENANT_A,
      'animal-1',
      { motivo: 'VENTA', fecha: '2026-08-20', confirmarConEventosPendientes: true },
      'usuario-1',
    );

    expect(prisma.servicio.findFirst).not.toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
