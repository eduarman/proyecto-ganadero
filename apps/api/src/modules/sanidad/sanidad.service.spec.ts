import { ConflictException, NotFoundException } from '@nestjs/common';
import { SanidadService } from './sanidad.service';

function buildDeps() {
  const prisma = {
    productoSanitario: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    animal: {
      findFirst: jest.fn(),
    },
    aplicacionSanitaria: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const service = new SanidadService(prisma as any);
  return { service, prisma };
}

const TENANT_A = 'tenant-a';

describe('SanidadService.crearProducto', () => {
  it('rechaza con 409 si el nombre ya existe en el mismo tenant', async () => {
    const { service, prisma } = buildDeps();
    prisma.productoSanitario.findUnique.mockResolvedValue({ id: 'existing' });

    await expect(
      service.crearProducto(TENANT_A, { nombre: 'Aftosa', tipo: 'VACUNA' }),
    ).rejects.toThrow(ConflictException);
  });
});

describe('SanidadService.crearAplicacion', () => {
  const dto = {
    animalId: 'animal-1',
    productoId: 'producto-1',
    fecha: '2026-08-20',
  };

  it('lanza 404 si el animal no existe en el tenant', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findFirst.mockResolvedValue(null);

    await expect(service.crearAplicacion(TENANT_A, dto, 'user-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('lanza 404 si el producto no existe en el tenant', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findFirst.mockResolvedValue({ id: 'animal-1' });
    prisma.productoSanitario.findFirst.mockResolvedValue(null);

    await expect(service.crearAplicacion(TENANT_A, dto, 'user-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('calcula proximaFechaEsperada cuando el producto tiene intervalo de refuerzo', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findFirst.mockResolvedValue({ id: 'animal-1' });
    prisma.productoSanitario.findFirst.mockResolvedValue({
      id: 'producto-1',
      intervaloRefuerzoDias: 30,
    });
    prisma.aplicacionSanitaria.create.mockResolvedValue({ id: 'aplicacion-1' });

    await service.crearAplicacion(TENANT_A, dto, 'user-1');

    const llamada = prisma.aplicacionSanitaria.create.mock.calls[0][0];
    expect(llamada.data.responsableId).toBe('user-1');
    expect(llamada.data.proximaFechaEsperada).toEqual(new Date('2026-09-19'));
  });

  it('deja proximaFechaEsperada en null si el producto no tiene intervalo de refuerzo', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findFirst.mockResolvedValue({ id: 'animal-1' });
    prisma.productoSanitario.findFirst.mockResolvedValue({
      id: 'producto-1',
      intervaloRefuerzoDias: null,
    });
    prisma.aplicacionSanitaria.create.mockResolvedValue({ id: 'aplicacion-1' });

    await service.crearAplicacion(TENANT_A, dto, 'user-1');

    const llamada = prisma.aplicacionSanitaria.create.mock.calls[0][0];
    expect(llamada.data.proximaFechaEsperada).toBeNull();
  });
});

describe('SanidadService.alertas', () => {
  it('marca vencido=true cuando proximaFechaEsperada ya pasó', async () => {
    const { service, prisma } = buildDeps();
    prisma.aplicacionSanitaria.findMany.mockResolvedValue([
      { id: 'a1', proximaFechaEsperada: new Date('2020-01-01') },
      { id: 'a2', proximaFechaEsperada: new Date('2099-01-01') },
    ]);

    const resultado = await service.alertas(TENANT_A);

    expect(resultado[0]).toMatchObject({ id: 'a1', vencido: true });
    expect(resultado[1]).toMatchObject({ id: 'a2', vencido: false });
  });
});
