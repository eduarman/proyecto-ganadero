import { NotFoundException } from '@nestjs/common';
import { ProduccionService } from './produccion.service';

function buildDeps() {
  const prisma = {
    animal: { findFirst: jest.fn() },
    registroLeche: {
      upsert: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
    registroLecheTotal: {
      upsert: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
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
