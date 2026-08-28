import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { TrabajadoresService } from './trabajadores.service';

function buildDeps() {
  const prisma = {
    cargo: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
    },
    trabajador: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const service = new TrabajadoresService(prisma as any);
  return { service, prisma };
}

const TENANT_A = 'negocio-a';

describe('TrabajadoresService.crearCargo', () => {
  it('rechaza con 409 si ya existe un cargo con ese nombre en el negocio', async () => {
    const { service, prisma } = buildDeps();
    prisma.cargo.findUnique.mockResolvedValue({ id: 'cargo-1' });

    await expect(service.crearCargo(TENANT_A, { nombre: 'Ordeñador' })).rejects.toThrow(ConflictException);
    expect(prisma.cargo.create).not.toHaveBeenCalled();
  });

  it('crea el cargo cuando el nombre está disponible', async () => {
    const { service, prisma } = buildDeps();
    prisma.cargo.findUnique.mockResolvedValue(null);
    prisma.cargo.create.mockResolvedValue({ id: 'cargo-1', nombre: 'Ordeñador' });

    const resultado = await service.crearCargo(TENANT_A, { nombre: 'Ordeñador' });

    expect(resultado.id).toBe('cargo-1');
    expect(prisma.cargo.create).toHaveBeenCalledWith({ data: { tenantId: TENANT_A, nombre: 'Ordeñador' } });
  });
});

const dtoBase = {
  nombres: 'Juan',
  apellidos: 'Pérez',
  documento: '12345678',
  cargoId: 'cargo-1',
  fechaIngreso: '2026-01-15',
  tipoContratacion: 'JORNAL' as const,
  modalidadPago: 'DIARIO' as const,
  salarioOJornal: 15,
};

describe('TrabajadoresService.crear', () => {
  it('rechaza con 409 si el documento ya existe en el negocio', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findUnique.mockResolvedValue({ id: 'trab-existente' });

    await expect(service.crear(TENANT_A, dtoBase)).rejects.toThrow(ConflictException);
    expect(prisma.trabajador.create).not.toHaveBeenCalled();
  });

  it('lanza 404 si el cargo no existe en el negocio', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findUnique.mockResolvedValue(null);
    prisma.cargo.findFirst.mockResolvedValue(null);

    await expect(service.crear(TENANT_A, dtoBase)).rejects.toThrow(NotFoundException);
    expect(prisma.trabajador.create).not.toHaveBeenCalled();
  });

  it('rechaza con 400 si el cargo existe pero está inactivo', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findUnique.mockResolvedValue(null);
    prisma.cargo.findFirst.mockResolvedValue({ id: 'cargo-1', estado: 'INACTIVO' });

    await expect(service.crear(TENANT_A, dtoBase)).rejects.toThrow(BadRequestException);
    expect(prisma.trabajador.create).not.toHaveBeenCalled();
  });

  it('crea el trabajador cuando documento y cargo son válidos', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findUnique.mockResolvedValue(null);
    prisma.cargo.findFirst.mockResolvedValue({ id: 'cargo-1', estado: 'ACTIVO' });
    prisma.trabajador.create.mockResolvedValue({ id: 'trab-1', ...dtoBase });

    const resultado = await service.crear(TENANT_A, dtoBase);

    expect(resultado.id).toBe('trab-1');
    expect(prisma.trabajador.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tenantId: TENANT_A, documento: '12345678', cargoId: 'cargo-1' }),
      }),
    );
  });
});

describe('TrabajadoresService.listar', () => {
  it('filtra por estado, cargo y búsqueda de texto', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findMany.mockResolvedValue([]);
    prisma.trabajador.count.mockResolvedValue(0);

    await service.listar(TENANT_A, { page: 1, limit: 20, estado: 'ACTIVO', cargoId: 'cargo-1', search: 'juan' });

    expect(prisma.trabajador.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: TENANT_A,
          estado: 'ACTIVO',
          cargoId: 'cargo-1',
          OR: expect.any(Array),
        }),
      }),
    );
  });
});

describe('TrabajadoresService.obtener', () => {
  it('lanza 404 si el trabajador no existe en el negocio', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findFirst.mockResolvedValue(null);

    await expect(service.obtener(TENANT_A, 'trab-1')).rejects.toThrow(NotFoundException);
  });

  it('calcula la antigüedad en años y meses desde fecha_ingreso', async () => {
    const { service, prisma } = buildDeps();
    const haceUnAnioYDosMeses = new Date();
    haceUnAnioYDosMeses.setUTCFullYear(haceUnAnioYDosMeses.getUTCFullYear() - 1);
    haceUnAnioYDosMeses.setUTCMonth(haceUnAnioYDosMeses.getUTCMonth() - 2);
    prisma.trabajador.findFirst.mockResolvedValue({
      id: 'trab-1',
      fechaIngreso: haceUnAnioYDosMeses,
      cargo: { id: 'cargo-1', nombre: 'Ordeñador' },
    });

    const resultado = await service.obtener(TENANT_A, 'trab-1');

    expect(resultado.antiguedad).toEqual({ anios: 1, meses: 2 });
  });
});

describe('TrabajadoresService.activar / inactivar', () => {
  it('inactivar lanza 404 si el trabajador no existe en el negocio', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findFirst.mockResolvedValue(null);

    await expect(service.inactivar(TENANT_A, 'trab-1')).rejects.toThrow(NotFoundException);
  });

  it('inactivar actualiza el estado a INACTIVO', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findFirst.mockResolvedValue({ id: 'trab-1' });
    prisma.trabajador.update.mockResolvedValue({ id: 'trab-1', estado: 'INACTIVO' });

    await service.inactivar(TENANT_A, 'trab-1');

    expect(prisma.trabajador.update).toHaveBeenCalledWith({ where: { id: 'trab-1' }, data: { estado: 'INACTIVO' } });
  });

  it('activar actualiza el estado a ACTIVO', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findFirst.mockResolvedValue({ id: 'trab-1' });
    prisma.trabajador.update.mockResolvedValue({ id: 'trab-1', estado: 'ACTIVO' });

    await service.activar(TENANT_A, 'trab-1');

    expect(prisma.trabajador.update).toHaveBeenCalledWith({ where: { id: 'trab-1' }, data: { estado: 'ACTIVO' } });
  });
});
