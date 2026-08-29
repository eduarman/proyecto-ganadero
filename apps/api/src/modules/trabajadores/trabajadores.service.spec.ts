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
    potrero: {
      findFirst: jest.fn(),
    },
    asignacion: {
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: undefined as any,
  };
  prisma.$transaction = jest.fn((fn: any) => fn(prisma));

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

describe('TrabajadoresService.crearAsignacion', () => {
  const dto = { cargoId: 'cargo-2', fechaInicio: '2026-08-01' };

  it('lanza 404 si el trabajador no existe en el negocio', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findFirst.mockResolvedValue(null);

    await expect(service.crearAsignacion(TENANT_A, 'trab-1', dto)).rejects.toThrow(NotFoundException);
  });

  it('rechaza con 400 si el trabajador está inactivo', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findFirst.mockResolvedValue({ id: 'trab-1', estado: 'INACTIVO' });

    await expect(service.crearAsignacion(TENANT_A, 'trab-1', dto)).rejects.toThrow(BadRequestException);
    expect(prisma.asignacion.create).not.toHaveBeenCalled();
  });

  it('rechaza con 400 si no viene cargo ni potrero', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findFirst.mockResolvedValue({ id: 'trab-1', estado: 'ACTIVO' });

    await expect(
      service.crearAsignacion(TENANT_A, 'trab-1', { fechaInicio: '2026-08-01' } as any),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.asignacion.create).not.toHaveBeenCalled();
  });

  it('lanza 404 si el potrero no existe en el negocio', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findFirst.mockResolvedValue({ id: 'trab-1', estado: 'ACTIVO' });
    prisma.potrero.findFirst.mockResolvedValue(null);

    await expect(
      service.crearAsignacion(TENANT_A, 'trab-1', { potreroId: 'potrero-1', fechaInicio: '2026-08-01' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('cierra la asignación abierta anterior y sincroniza trabajador.cargoId', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findFirst.mockResolvedValue({ id: 'trab-1', estado: 'ACTIVO' });
    prisma.cargo.findFirst.mockResolvedValue({ id: 'cargo-2', estado: 'ACTIVO' });
    prisma.asignacion.findFirst.mockResolvedValue({ id: 'asig-anterior', fechaFin: null });
    prisma.asignacion.create.mockResolvedValue({
      id: 'asig-nueva',
      cargoId: 'cargo-2',
      fechaInicio: new Date('2026-08-01'),
      fechaFin: null,
    });

    const resultado = await service.crearAsignacion(TENANT_A, 'trab-1', dto);

    expect(prisma.asignacion.update).toHaveBeenCalledWith({
      where: { id: 'asig-anterior' },
      data: { fechaFin: new Date('2026-08-01') },
    });
    expect(prisma.trabajador.update).toHaveBeenCalledWith({
      where: { id: 'trab-1' },
      data: { cargoId: 'cargo-2' },
    });
    expect(resultado.estado).toBe('VIGENTE');
  });

  it('no cierra ninguna asignación anterior si no había una abierta', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findFirst.mockResolvedValue({ id: 'trab-1', estado: 'ACTIVO' });
    prisma.cargo.findFirst.mockResolvedValue({ id: 'cargo-2', estado: 'ACTIVO' });
    prisma.asignacion.findFirst.mockResolvedValue(null);
    prisma.asignacion.create.mockResolvedValue({
      id: 'asig-nueva',
      cargoId: 'cargo-2',
      fechaInicio: new Date('2026-08-01'),
      fechaFin: null,
    });

    await service.crearAsignacion(TENANT_A, 'trab-1', dto);

    expect(prisma.asignacion.update).not.toHaveBeenCalled();
  });
});

describe('TrabajadoresService.finalizarAsignacion', () => {
  it('lanza 404 si la asignación no existe en el negocio', async () => {
    const { service, prisma } = buildDeps();
    prisma.asignacion.findFirst.mockResolvedValue(null);

    await expect(service.finalizarAsignacion(TENANT_A, 'asig-1', {})).rejects.toThrow(NotFoundException);
  });

  it('rechaza con 400 si ya está finalizada', async () => {
    const { service, prisma } = buildDeps();
    prisma.asignacion.findFirst.mockResolvedValue({ id: 'asig-1', fechaFin: new Date('2026-08-01') });

    await expect(service.finalizarAsignacion(TENANT_A, 'asig-1', {})).rejects.toThrow(BadRequestException);
    expect(prisma.asignacion.update).not.toHaveBeenCalled();
  });

  it('finaliza con la fecha indicada', async () => {
    const { service, prisma } = buildDeps();
    prisma.asignacion.findFirst.mockResolvedValue({ id: 'asig-1', fechaFin: null });
    prisma.asignacion.update.mockResolvedValue({ id: 'asig-1', fechaFin: new Date('2026-08-15') });

    await service.finalizarAsignacion(TENANT_A, 'asig-1', { fechaFin: '2026-08-15' });

    expect(prisma.asignacion.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'asig-1' }, data: { fechaFin: new Date('2026-08-15') } }),
    );
  });
});

describe('TrabajadoresService.listarAsignaciones', () => {
  it('calcula el estado VIGENTE/FINALIZADA por fila', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findFirst.mockResolvedValue({ id: 'trab-1' });
    prisma.asignacion.findMany.mockResolvedValue([
      { id: 'asig-1', fechaFin: null },
      { id: 'asig-2', fechaFin: new Date('2026-07-01') },
    ]);

    const resultado = await service.listarAsignaciones(TENANT_A, 'trab-1');

    expect(resultado).toEqual([
      { id: 'asig-1', fechaFin: null, estado: 'VIGENTE' },
      { id: 'asig-2', fechaFin: new Date('2026-07-01'), estado: 'FINALIZADA' },
    ]);
  });
});
