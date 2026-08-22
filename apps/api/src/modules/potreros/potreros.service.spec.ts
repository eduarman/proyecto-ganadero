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
      findFirst: jest.fn(),
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

    expect(resultado).toEqual([{ id: 'p1', nombre: 'Potrero 1', ocupacionActual: 3, diasDescanso: null }]);
    expect(prisma.animal.count).toHaveBeenCalledWith({
      where: { potreroActualId: 'p1', estado: 'ACTIVO' },
    });
  });
});

describe('PotrerosService.validarCapacidad', () => {
  it('no excede si el potrero no tiene capacidad de carga configurada', async () => {
    const { service, prisma } = buildDeps();
    prisma.potrero.findFirst.mockResolvedValue({ id: 'p1', capacidadCarga: null });
    prisma.animal.count.mockResolvedValue(5);

    const resultado = await service.validarCapacidad(TENANT_A, 'p1', 10);

    expect(resultado).toEqual({ excede: false, ocupacionActual: 5, capacidadCarga: null, ocupacionResultante: 15 });
  });

  it('no excede si la ocupación resultante queda dentro de la capacidad de carga', async () => {
    const { service, prisma } = buildDeps();
    prisma.potrero.findFirst.mockResolvedValue({ id: 'p1', capacidadCarga: 20 });
    prisma.animal.count.mockResolvedValue(5);

    const resultado = await service.validarCapacidad(TENANT_A, 'p1', 10);

    expect(resultado).toEqual({ excede: false, ocupacionActual: 5, capacidadCarga: 20, ocupacionResultante: 15 });
  });

  it('excede si la ocupación resultante supera la capacidad de carga', async () => {
    const { service, prisma } = buildDeps();
    prisma.potrero.findFirst.mockResolvedValue({ id: 'p1', capacidadCarga: 10 });
    prisma.animal.count.mockResolvedValue(5);

    const resultado = await service.validarCapacidad(TENANT_A, 'p1', 10);

    expect(resultado).toEqual({ excede: true, ocupacionActual: 5, capacidadCarga: 10, ocupacionResultante: 15 });
  });
});

describe('PotrerosService.diasDescanso (via obtener)', () => {
  it('es null si el potrero tiene animales activos asignados', async () => {
    const { service, prisma } = buildDeps();
    prisma.potrero.findFirst.mockResolvedValue({ id: 'p1' });
    prisma.animal.count.mockResolvedValue(2);

    const resultado = await service.obtener(TENANT_A, 'p1');

    expect(resultado.diasDescanso).toBeNull();
    expect(prisma.animalMovimiento.findFirst).not.toHaveBeenCalled();
  });

  it('es null si el potrero está vacío pero nunca tuvo movimientos registrados', async () => {
    const { service, prisma } = buildDeps();
    prisma.potrero.findFirst.mockResolvedValue({ id: 'p1' });
    prisma.animal.count.mockResolvedValue(0);
    prisma.animalMovimiento.findFirst.mockResolvedValue(null);

    const resultado = await service.obtener(TENANT_A, 'p1');

    expect(resultado.diasDescanso).toBeNull();
  });

  it('calcula los días desde la última salida cuando el potrero está vacío', async () => {
    const { service, prisma } = buildDeps();
    prisma.potrero.findFirst.mockResolvedValue({ id: 'p1' });
    prisma.animal.count.mockResolvedValue(0);
    const hace3Dias = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    prisma.animalMovimiento.findFirst.mockResolvedValue({ id: 'mov-1', fecha: hace3Dias });

    const resultado = await service.obtener(TENANT_A, 'p1');

    expect(resultado.diasDescanso).toBe(3);
    expect(prisma.animalMovimiento.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: TENANT_A, potreroOrigenId: 'p1' } }),
    );
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
