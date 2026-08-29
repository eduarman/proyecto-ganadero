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
    asistencia: {
      findUnique: jest.fn().mockResolvedValue(null),
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

describe('TrabajadoresService.crearAsistencia', () => {
  const dto = { fecha: '2026-08-01', estado: 'PRESENTE' as const };

  it('rechaza con 400 si el trabajador está inactivo', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findFirst.mockResolvedValue({ id: 'trab-1', estado: 'INACTIVO' });

    await expect(service.crearAsistencia(TENANT_A, 'trab-1', dto, 'user-1')).rejects.toThrow(BadRequestException);
    expect(prisma.asistencia.create).not.toHaveBeenCalled();
  });

  it('rechaza con 400 si la fecha es futura', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findFirst.mockResolvedValue({ id: 'trab-1', estado: 'ACTIVO' });
    const manana = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    await expect(
      service.crearAsistencia(TENANT_A, 'trab-1', { ...dto, fecha: manana }, 'user-1'),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.asistencia.create).not.toHaveBeenCalled();
  });

  it('rechaza con 400 si la hora de salida es anterior a la de entrada', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findFirst.mockResolvedValue({ id: 'trab-1', estado: 'ACTIVO' });

    await expect(
      service.crearAsistencia(
        TENANT_A,
        'trab-1',
        { ...dto, horaEntrada: '17:00', horaSalida: '08:00' },
        'user-1',
      ),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.asistencia.create).not.toHaveBeenCalled();
  });

  it('rechaza con 409 si ya existe un registro para esa fecha sin confirmar', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findFirst.mockResolvedValue({ id: 'trab-1', estado: 'ACTIVO' });
    prisma.asistencia.findUnique.mockResolvedValue({ id: 'asis-1' });

    await expect(service.crearAsistencia(TENANT_A, 'trab-1', dto, 'user-1')).rejects.toThrow(ConflictException);
    expect(prisma.asistencia.create).not.toHaveBeenCalled();
    expect(prisma.asistencia.update).not.toHaveBeenCalled();
  });

  it('reemplaza (update) el registro existente cuando confirmar es true', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findFirst.mockResolvedValue({ id: 'trab-1', estado: 'ACTIVO' });
    prisma.asistencia.findUnique.mockResolvedValue({ id: 'asis-1' });
    prisma.asistencia.update.mockResolvedValue({ id: 'asis-1', horaEntrada: null, horaSalida: null });

    await service.crearAsistencia(TENANT_A, 'trab-1', { ...dto, confirmar: true }, 'user-1');

    expect(prisma.asistencia.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'asis-1' } }),
    );
    expect(prisma.asistencia.create).not.toHaveBeenCalled();
  });

  it('crea el registro y calcula horasTrabajadas cuando no existe uno previo', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findFirst.mockResolvedValue({ id: 'trab-1', estado: 'ACTIVO' });
    prisma.asistencia.findUnique.mockResolvedValue(null);
    prisma.asistencia.create.mockResolvedValue({
      id: 'asis-1',
      horaEntrada: '08:00',
      horaSalida: '16:30',
    });

    const resultado = await service.crearAsistencia(
      TENANT_A,
      'trab-1',
      { ...dto, horaEntrada: '08:00', horaSalida: '16:30' },
      'user-1',
    );

    expect(resultado.horasTrabajadas).toBe(8.5);
  });

  it('devuelve horasTrabajadas null si falta alguna de las dos horas', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findFirst.mockResolvedValue({ id: 'trab-1', estado: 'ACTIVO' });
    prisma.asistencia.findUnique.mockResolvedValue(null);
    prisma.asistencia.create.mockResolvedValue({ id: 'asis-1', horaEntrada: '08:00', horaSalida: null });

    const resultado = await service.crearAsistencia(TENANT_A, 'trab-1', { ...dto, horaEntrada: '08:00' }, 'user-1');

    expect(resultado.horasTrabajadas).toBeNull();
  });
});

describe('TrabajadoresService.listarAsistenciaDelDia', () => {
  it('cruza los trabajadores activos con su registro del día, dejando null si no tienen', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findMany.mockResolvedValue([
      { id: 'trab-1', nombres: 'Ana' },
      { id: 'trab-2', nombres: 'Beto' },
    ]);
    prisma.asistencia.findMany.mockResolvedValue([
      { id: 'asis-1', trabajadorId: 'trab-1', horaEntrada: '08:00', horaSalida: '12:00' },
    ]);

    const resultado = await service.listarAsistenciaDelDia(TENANT_A, '2026-08-01');

    expect(resultado).toHaveLength(2);
    expect(resultado[0].asistencia?.horasTrabajadas).toBe(4);
    expect(resultado[1].asistencia).toBeNull();
  });
});
