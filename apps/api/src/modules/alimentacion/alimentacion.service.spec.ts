import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { AlimentacionService } from './alimentacion.service';

function buildDeps() {
  const prisma = {
    insumoAlimentacion: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    planAlimentacion: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    planAlimentacionItem: { createMany: jest.fn() },
    planAsignacion: { create: jest.fn() },
    potrero: { findFirst: jest.fn() },
    animal: { count: jest.fn() },
    suministro: { create: jest.fn(), findMany: jest.fn() },
    $transaction: jest.fn(),
  };

  const service = new AlimentacionService(prisma as any);
  return { service, prisma };
}

const TENANT_A = 'tenant-a';

describe('AlimentacionService.crearInsumo', () => {
  it('rechaza con 409 si ya existe un insumo con el mismo nombre en el tenant', async () => {
    const { service, prisma } = buildDeps();
    prisma.insumoAlimentacion.findUnique.mockResolvedValue({ id: 'insumo-existente' });

    await expect(
      service.crearInsumo(TENANT_A, { nombre: 'Ensilaje', unidadMedida: 'kg' }),
    ).rejects.toThrow(ConflictException);
    expect(prisma.insumoAlimentacion.create).not.toHaveBeenCalled();
  });

  it('crea el insumo si el nombre está disponible', async () => {
    const { service, prisma } = buildDeps();
    prisma.insumoAlimentacion.findUnique.mockResolvedValue(null);
    prisma.insumoAlimentacion.create.mockResolvedValue({ id: 'insumo-1' });

    await service.crearInsumo(TENANT_A, { nombre: 'Ensilaje', unidadMedida: 'kg', costoUnitario: 0.5 });

    expect(prisma.insumoAlimentacion.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ nombre: 'Ensilaje', costoUnitario: 0.5 }) }),
    );
  });
});

describe('AlimentacionService.crearPlan', () => {
  const dto = {
    nombre: 'Dieta lactancia',
    tipo: 'MIXTO' as const,
    items: [{ insumoId: 'insumo-1', cantidad: 5, unidadTiempo: 'DIA' as const, por: 'ANIMAL' as const }],
  };

  it('rechaza con 409 si ya existe un plan con el mismo nombre', async () => {
    const { service, prisma } = buildDeps();
    prisma.planAlimentacion.findUnique.mockResolvedValue({ id: 'plan-existente' });

    await expect(service.crearPlan(TENANT_A, dto)).rejects.toThrow(ConflictException);
  });

  it('lanza 404 si algún insumo del plan no existe en el tenant', async () => {
    const { service, prisma } = buildDeps();
    prisma.planAlimentacion.findUnique.mockResolvedValue(null);
    prisma.insumoAlimentacion.count.mockResolvedValue(0);

    await expect(service.crearPlan(TENANT_A, dto)).rejects.toThrow(NotFoundException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('crea el plan y sus ítems en una transacción cuando todo es válido', async () => {
    const { service, prisma } = buildDeps();
    prisma.planAlimentacion.findUnique.mockResolvedValue(null);
    prisma.insumoAlimentacion.count.mockResolvedValue(1);

    const tx = {
      planAlimentacion: {
        create: jest.fn().mockResolvedValue({ id: 'plan-1' }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'plan-1', items: [] }),
      },
      planAlimentacionItem: { createMany: jest.fn() },
    };
    prisma.$transaction.mockImplementation((fn: any) => fn(tx));

    await service.crearPlan(TENANT_A, dto);

    expect(tx.planAlimentacion.create).toHaveBeenCalled();
    expect(tx.planAlimentacionItem.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [expect.objectContaining({ planId: 'plan-1', insumoId: 'insumo-1' })],
      }),
    );
  });
});

describe('AlimentacionService.crearAsignacion', () => {
  it('lanza 404 si el plan no existe en el tenant', async () => {
    const { service, prisma } = buildDeps();
    prisma.planAlimentacion.findFirst.mockResolvedValue(null);

    await expect(
      service.crearAsignacion(TENANT_A, 'plan-1', { potreroId: 'potrero-1', fechaInicio: '2026-01-01' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rechaza asignar un plan inactivo', async () => {
    const { service, prisma } = buildDeps();
    prisma.planAlimentacion.findFirst.mockResolvedValue({ id: 'plan-1', estado: 'INACTIVO' });

    await expect(
      service.crearAsignacion(TENANT_A, 'plan-1', { potreroId: 'potrero-1', fechaInicio: '2026-01-01' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rechaza si se indican potrero y lote de animales a la vez', async () => {
    const { service, prisma } = buildDeps();
    prisma.planAlimentacion.findFirst.mockResolvedValue({ id: 'plan-1', estado: 'ACTIVO' });

    await expect(
      service.crearAsignacion(TENANT_A, 'plan-1', {
        potreroId: 'potrero-1',
        animalIds: ['animal-1'],
        fechaInicio: '2026-01-01',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rechaza si no se indica ningún destino', async () => {
    const { service, prisma } = buildDeps();
    prisma.planAlimentacion.findFirst.mockResolvedValue({ id: 'plan-1', estado: 'ACTIVO' });

    await expect(
      service.crearAsignacion(TENANT_A, 'plan-1', { fechaInicio: '2026-01-01' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('asigna el plan a un lote de animales cuando todos existen en el tenant', async () => {
    const { service, prisma } = buildDeps();
    prisma.planAlimentacion.findFirst.mockResolvedValue({ id: 'plan-1', estado: 'ACTIVO' });
    prisma.animal.count.mockResolvedValue(2);
    prisma.planAsignacion.create.mockResolvedValue({ id: 'asignacion-1' });

    await service.crearAsignacion(TENANT_A, 'plan-1', {
      animalIds: ['animal-1', 'animal-2'],
      fechaInicio: '2026-01-01',
    });

    expect(prisma.planAsignacion.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ animalIds: ['animal-1', 'animal-2'] }) }),
    );
  });
});

describe('AlimentacionService.crearSuministro', () => {
  const dto = { fecha: '2026-01-01', insumoId: 'insumo-1', potreroId: 'potrero-1', cantidad: 5 };

  it('lanza 404 si el insumo no existe en el tenant', async () => {
    const { service, prisma } = buildDeps();
    prisma.insumoAlimentacion.findFirst.mockResolvedValue(null);

    await expect(service.crearSuministro(TENANT_A, dto, 'usuario-1')).rejects.toThrow(NotFoundException);
  });

  it('rechaza un lote de más de un animal en el registro manual', async () => {
    const { service, prisma } = buildDeps();
    prisma.insumoAlimentacion.findFirst.mockResolvedValue({ id: 'insumo-1' });

    await expect(
      service.crearSuministro(
        TENANT_A,
        { fecha: '2026-01-01', insumoId: 'insumo-1', animalIds: ['a1', 'a2'], cantidad: 5 },
        'usuario-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('registra el suministro cuando el destino es válido', async () => {
    const { service, prisma } = buildDeps();
    prisma.insumoAlimentacion.findFirst.mockResolvedValue({ id: 'insumo-1' });
    prisma.potrero.findFirst.mockResolvedValue({ id: 'potrero-1' });
    prisma.suministro.create.mockResolvedValue({ id: 'suministro-1' });

    await service.crearSuministro(TENANT_A, dto, 'usuario-1');

    expect(prisma.suministro.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ potreroId: 'potrero-1', registradoPorId: 'usuario-1' }),
      }),
    );
  });
});

describe('AlimentacionService.costos', () => {
  it('marca costoParcial cuando algún insumo consumido no tiene costo unitario cargado', async () => {
    const { service, prisma } = buildDeps();
    prisma.suministro.findMany.mockResolvedValue([
      { insumoId: 'insumo-1', cantidad: 5, insumo: { nombre: 'Ensilaje', costoUnitario: 2 } },
      { insumoId: 'insumo-2', cantidad: 3, insumo: { nombre: 'Pastura', costoUnitario: null } },
    ]);
    prisma.animal.count.mockResolvedValue(10);

    const resultado = await service.costos(TENANT_A);

    expect(resultado.costoParcial).toBe(true);
    expect(resultado.costoTotalGeneral).toBe(10);
    expect(resultado.consumoTotalKg).toBe(8);
    expect(resultado.consumoPromedioPorAnimal).toBe(0.8);
  });

  it('no marca costoParcial cuando todos los insumos consumidos tienen costo cargado', async () => {
    const { service, prisma } = buildDeps();
    prisma.suministro.findMany.mockResolvedValue([
      { insumoId: 'insumo-1', cantidad: 4, insumo: { nombre: 'Ensilaje', costoUnitario: 2 } },
    ]);
    prisma.animal.count.mockResolvedValue(4);

    const resultado = await service.costos(TENANT_A);

    expect(resultado.costoParcial).toBe(false);
    expect(resultado.costoTotalGeneral).toBe(8);
  });
});
