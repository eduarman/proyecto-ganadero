import { NotFoundException } from '@nestjs/common';
import { ProduccionService } from './produccion.service';

function buildDeps() {
  const prisma = {
    animal: { findFirst: jest.fn(), findMany: jest.fn() },
    registroLeche: {
      upsert: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
    registroLecheTotal: {
      upsert: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
    registroPeso: {
      upsert: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
    $transaction: jest.fn(),
  };

  const service = new ProduccionService(prisma as any);
  return { service, prisma };
}

const TENANT_A = 'tenant-a';

describe('ProduccionService.registrarLeche', () => {
  const dto = { animalId: 'animal-1', fecha: '2026-08-20', turno: 'MANANA' as const, litros: 15.4 };

  it('lanza 404 si el animal no existe en el tenant', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findFirst.mockResolvedValue(null);

    await expect(service.registrarLeche(TENANT_A, dto, 'user-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('hace upsert por tenant+animal+fecha+turno para no duplicar', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findFirst.mockResolvedValue({ id: 'animal-1' });
    prisma.registroLeche.upsert.mockResolvedValue({ id: 'registro-1' });

    await service.registrarLeche(TENANT_A, dto, 'user-1');

    expect(prisma.registroLeche.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId_animalId_fecha_turno: {
            tenantId: TENANT_A,
            animalId: 'animal-1',
            fecha: new Date('2026-08-20'),
            turno: 'MANANA',
          },
        },
      }),
    );
  });
});

describe('ProduccionService.registrarTotal', () => {
  it('hace upsert por tenant+fecha+turno para no duplicar', async () => {
    const { service, prisma } = buildDeps();
    prisma.registroLecheTotal.upsert.mockResolvedValue({ id: 'total-1' });

    await service.registrarTotal(
      TENANT_A,
      { fecha: '2026-08-20', turno: 'MANANA', litrosTotal: 1800 },
      'user-1',
    );

    expect(prisma.registroLecheTotal.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId_fecha_turno: { tenantId: TENANT_A, fecha: new Date('2026-08-20'), turno: 'MANANA' },
        },
      }),
    );
  });
});

describe('ProduccionService.indicadores', () => {
  it('calcula total y promedio del día a partir de los registros de hoy', async () => {
    const { service, prisma } = buildDeps();
    const hoy = new Date();
    const hoyUtc = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate(), 6));

    prisma.registroLeche.findMany.mockResolvedValue([
      { animalId: 'a1', litros: '10.00', fecha: hoyUtc },
      { animalId: 'a2', litros: '20.00', fecha: hoyUtc },
    ]);

    const resultado = await service.indicadores(TENANT_A);

    expect(resultado.totalHoy).toBe(30);
    expect(resultado.animalesHoy).toBe(2);
    expect(resultado.promedioHoy).toBe(15);
    expect(resultado.meses).toHaveLength(6);
  });

  it('suma las cargas de "total por turno" al total del día sin afectar el promedio por animal', async () => {
    const { service, prisma } = buildDeps();
    const hoy = new Date();
    const hoyUtc = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate(), 6));

    prisma.registroLeche.findMany.mockResolvedValue([
      { animalId: 'a1', litros: '10.00', fecha: hoyUtc },
    ]);
    prisma.registroLecheTotal.findMany.mockResolvedValue([
      { litrosTotal: '500.00', fecha: hoyUtc },
    ]);

    const resultado = await service.indicadores(TENANT_A);

    expect(resultado.totalHoy).toBe(510);
    expect(resultado.animalesHoy).toBe(1);
    expect(resultado.promedioHoy).toBe(10);
  });

  it('devuelve variacionMensualPct null cuando el mes anterior no tuvo registros', async () => {
    const { service, prisma } = buildDeps();
    prisma.registroLeche.findMany.mockResolvedValue([]);

    const resultado = await service.indicadores(TENANT_A);

    expect(resultado.variacionMensualPct).toBeNull();
    expect(resultado.totalHoy).toBe(0);
    expect(resultado.promedioHoy).toBe(0);
  });
});

describe('ProduccionService.listar', () => {
  it('filtra por animalId cuando se indica (ficha consolidada de ganado)', async () => {
    const { service, prisma } = buildDeps();
    prisma.registroLeche.findMany.mockResolvedValue([]);

    await service.listar(TENANT_A, 'animal-1');

    expect(prisma.registroLeche.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: TENANT_A, animalId: 'animal-1' } }),
    );
  });
});

describe('ProduccionService.registrarPeso', () => {
  const dto = { animalId: 'animal-1', fecha: '2026-08-20', pesoKg: 320 };

  it('lanza 404 si el animal no existe en el tenant', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findFirst.mockResolvedValue(null);

    await expect(service.registrarPeso(TENANT_A, dto, 'user-1')).rejects.toThrow(NotFoundException);
  });

  it('hace upsert por tenant+animal+fecha para no duplicar', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findFirst.mockResolvedValue({ id: 'animal-1' });
    prisma.registroPeso.upsert.mockResolvedValue({ id: 'peso-1' });

    await service.registrarPeso(TENANT_A, dto, 'user-1');

    expect(prisma.registroPeso.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId_animalId_fecha: { tenantId: TENANT_A, animalId: 'animal-1', fecha: new Date('2026-08-20') },
        },
      }),
    );
  });
});

describe('ProduccionService.registrarPesoLote', () => {
  const dto = {
    fecha: '2026-08-20',
    registros: [
      { animalId: 'animal-1', pesoKg: 300 },
      { animalId: 'animal-2', pesoKg: 280 },
    ],
  };

  it('lanza 404 si algún animal del lote no existe en el tenant', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findMany.mockResolvedValue([{ id: 'animal-1' }]);

    await expect(service.registrarPesoLote(TENANT_A, dto, 'user-1')).rejects.toThrow(NotFoundException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('hace upsert transaccional por cada animal del lote', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findMany.mockResolvedValue([{ id: 'animal-1' }, { id: 'animal-2' }]);
    prisma.registroPeso.upsert.mockImplementation(({ create }: any) =>
      Promise.resolve({ id: `peso-${create.animalId}`, ...create }),
    );
    prisma.$transaction.mockImplementation((ops: any[]) => Promise.all(ops));

    const resultado = await service.registrarPesoLote(TENANT_A, dto, 'user-1');

    expect(resultado).toHaveLength(2);
    expect(prisma.registroPeso.upsert).toHaveBeenCalledTimes(2);
  });
});

describe('ProduccionService.gdp', () => {
  it('lanza 404 si el animal no existe en el tenant', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findFirst.mockResolvedValue(null);

    await expect(service.gdp(TENANT_A, 'animal-1')).rejects.toThrow(NotFoundException);
  });

  it('devuelve gdpKgDia null cuando hay un solo pesaje (sin anterior con qué comparar)', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findFirst.mockResolvedValue({ id: 'animal-1' });
    prisma.registroPeso.findMany.mockResolvedValue([
      { id: 'p1', fecha: new Date('2026-08-01'), pesoKg: '300.00' },
    ]);

    const resultado = await service.gdp(TENANT_A, 'animal-1');

    expect(resultado).toEqual([{ id: 'p1', fecha: new Date('2026-08-01'), pesoKg: '300.00', gdpKgDia: null }]);
  });

  it('calcula la ganancia diaria de peso entre pesajes consecutivos', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findFirst.mockResolvedValue({ id: 'animal-1' });
    prisma.registroPeso.findMany.mockResolvedValue([
      { id: 'p1', fecha: new Date('2026-08-01'), pesoKg: '300.00' },
      { id: 'p2', fecha: new Date('2026-08-11'), pesoKg: '310.00' },
    ]);

    const resultado = await service.gdp(TENANT_A, 'animal-1');

    expect(resultado[0].gdpKgDia).toBeNull();
    expect(resultado[1].gdpKgDia).toBe(1); // (310 - 300) kg / 10 días
  });
});
