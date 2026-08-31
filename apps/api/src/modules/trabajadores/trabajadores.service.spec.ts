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
    adelanto: {
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
    },
    prestamo: {
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
    },
    prestamoAbono: {
      create: jest.fn(),
    },
    pago: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
    },
    $transaction: undefined as any,
  };
  prisma.$transaction = jest.fn((fn: any) => fn(prisma));

  const exportService = {
    renderXlsx: jest.fn().mockResolvedValue(Buffer.from('xlsx')),
    renderPdf: jest.fn().mockResolvedValue(Buffer.from('pdf')),
    renderCsv: jest.fn().mockReturnValue('csv'),
  };

  const service = new TrabajadoresService(prisma as any, exportService as any);
  return { service, prisma, exportService };
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
    // Se fija el día en 1 antes de restar meses/años para no depender del día
    // actual del mes (restar meses sobre un día 29-31 puede desbordar a un
    // mes distinto si el mes destino tiene menos días — flakiness real que
    // afectaba este test cerca de fin de mes).
    const ahora = new Date();
    const haceUnAnioYDosMeses = new Date(Date.UTC(ahora.getUTCFullYear() - 1, ahora.getUTCMonth() - 2, 1));
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

describe('TrabajadoresService.crearAdelanto', () => {
  const dtoUsd = { fecha: '2026-08-01', monto: 100, moneda: 'USD' as const, motivo: 'Emergencia' };

  it('rechaza con 400 si el trabajador está inactivo', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findFirst.mockResolvedValue({ id: 'trab-1', estado: 'INACTIVO' });

    await expect(service.crearAdelanto(TENANT_A, 'trab-1', dtoUsd, 'user-1')).rejects.toThrow(BadRequestException);
    expect(prisma.adelanto.create).not.toHaveBeenCalled();
  });

  it('en USD no exige tasa de cambio ni calcula equivalente', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findFirst.mockResolvedValue({ id: 'trab-1', estado: 'ACTIVO' });
    prisma.adelanto.create.mockResolvedValue({ id: 'adel-1' });

    await service.crearAdelanto(TENANT_A, 'trab-1', dtoUsd, 'user-1');

    expect(prisma.adelanto.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ tasaCambio: null, montoEquivalenteUsd: null }) }),
    );
  });

  it('rechaza con 400 si es VES sin tasa de cambio', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findFirst.mockResolvedValue({ id: 'trab-1', estado: 'ACTIVO' });

    await expect(
      service.crearAdelanto(TENANT_A, 'trab-1', { ...dtoUsd, moneda: 'VES' }, 'user-1'),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.adelanto.create).not.toHaveBeenCalled();
  });

  it('en VES calcula el equivalente en USD con la tasa dada', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findFirst.mockResolvedValue({ id: 'trab-1', estado: 'ACTIVO' });
    prisma.adelanto.create.mockResolvedValue({ id: 'adel-1' });

    await service.crearAdelanto(TENANT_A, 'trab-1', { ...dtoUsd, moneda: 'VES', tasaCambio: 40 }, 'user-1');

    expect(prisma.adelanto.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tasaCambio: 40, montoEquivalenteUsd: 2.5 }),
      }),
    );
  });
});

describe('TrabajadoresService.listarAdelantos', () => {
  it('calcula el saldo pendiente restando lo descontado', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findFirst.mockResolvedValue({ id: 'trab-1' });
    prisma.adelanto.findMany.mockResolvedValue([{ id: 'adel-1', monto: '100', montoDescontado: '30' }]);

    const resultado = await service.listarAdelantos(TENANT_A, 'trab-1');

    expect(resultado[0].saldoPendiente).toBe(70);
  });
});

describe('TrabajadoresService.crearAbonoPrestamo', () => {
  it('lanza 404 si el préstamo no existe en el negocio', async () => {
    const { service, prisma } = buildDeps();
    prisma.prestamo.findFirst.mockResolvedValue(null);

    await expect(
      service.crearAbonoPrestamo(TENANT_A, 'prest-1', { fecha: '2026-08-01', monto: 50 }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rechaza con 400 si el abono supera el saldo pendiente', async () => {
    const { service, prisma } = buildDeps();
    prisma.prestamo.findFirst.mockResolvedValue({
      id: 'prest-1',
      montoOriginal: '300',
      abonos: [{ monto: '250' }],
    });

    await expect(
      service.crearAbonoPrestamo(TENANT_A, 'prest-1', { fecha: '2026-08-01', monto: 100 }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.prestamoAbono.create).not.toHaveBeenCalled();
  });

  it('crea el abono cuando no supera el saldo pendiente', async () => {
    const { service, prisma } = buildDeps();
    prisma.prestamo.findFirst.mockResolvedValue({
      id: 'prest-1',
      montoOriginal: '300',
      abonos: [{ monto: '100' }],
    });
    prisma.prestamoAbono.create.mockResolvedValue({ id: 'abono-1' });

    await service.crearAbonoPrestamo(TENANT_A, 'prest-1', { fecha: '2026-08-01', monto: 150 });

    expect(prisma.prestamoAbono.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ prestamoId: 'prest-1', monto: 150 }) }),
    );
  });
});

describe('TrabajadoresService.listarPrestamos', () => {
  it('calcula totalPagado, saldoPendiente y cuotasPagadas', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findFirst.mockResolvedValue({ id: 'trab-1' });
    prisma.prestamo.findMany.mockResolvedValue([
      {
        id: 'prest-1',
        montoOriginal: '300',
        valorCuota: '100',
        abonos: [{ monto: '100' }, { monto: '100' }],
      },
    ]);

    const resultado = await service.listarPrestamos(TENANT_A, 'trab-1');

    expect(resultado[0]).toMatchObject({ totalPagado: 200, saldoPendiente: 100, cuotasPagadas: 2 });
  });
});

describe('TrabajadoresService.previsualizarPago', () => {
  const dtoJornal = { tipo: 'JORNAL' as const, periodoDesde: '2026-08-01', periodoHasta: '2026-08-31' };

  it('para JORNAL calcula el monto base sugerido desde los jornales realizados', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findFirst.mockResolvedValue({ id: 'trab-1', salarioOJornal: '15' });
    prisma.asistencia.findMany.mockResolvedValue([
      { estado: 'PRESENTE', jornalRealizado: '1', horaEntrada: null, horaSalida: null },
      { estado: 'PRESENTE', jornalRealizado: '1', horaEntrada: null, horaSalida: null },
      { estado: 'AUSENTE', jornalRealizado: null, horaEntrada: null, horaSalida: null },
    ]);

    const resultado = await service.previsualizarPago(TENANT_A, 'trab-1', dtoJornal);

    expect(resultado.jornadas).toBe(2);
    expect(resultado.jornalesRealizados).toBe(2);
    expect(resultado.montoBaseSugerido).toBe(30);
  });

  it('para SALARIO devuelve el salario acordado tal cual', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findFirst.mockResolvedValue({ id: 'trab-1', salarioOJornal: '500' });
    prisma.asistencia.findMany.mockResolvedValue([]);

    const resultado = await service.previsualizarPago(TENANT_A, 'trab-1', { ...dtoJornal, tipo: 'SALARIO' });

    expect(resultado.montoBaseSugerido).toBe(500);
  });

  it('para BONO no sugiere ningún monto base (se ingresa a mano)', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findFirst.mockResolvedValue({ id: 'trab-1', salarioOJornal: '500' });
    prisma.asistencia.findMany.mockResolvedValue([]);

    const resultado = await service.previsualizarPago(TENANT_A, 'trab-1', { ...dtoJornal, tipo: 'BONO' });

    expect(resultado.montoBaseSugerido).toBe(0);
  });

  it('solo incluye adelantos/préstamos con saldo pendiente > 0', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findFirst.mockResolvedValue({ id: 'trab-1', salarioOJornal: '500' });
    prisma.asistencia.findMany.mockResolvedValue([]);
    prisma.adelanto.findMany.mockResolvedValue([
      { id: 'adel-1', monto: '100', montoDescontado: '0' },
      { id: 'adel-2', monto: '50', montoDescontado: '50' },
    ]);

    const resultado = await service.previsualizarPago(TENANT_A, 'trab-1', { ...dtoJornal, tipo: 'BONO' });

    expect(resultado.adelantosPendientes).toHaveLength(1);
    expect(resultado.adelantosPendientes[0].id).toBe('adel-1');
  });
});

describe('TrabajadoresService.confirmarPago', () => {
  const dto = {
    tipo: 'BONO' as const,
    periodoDesde: '2026-08-01',
    periodoHasta: '2026-08-31',
    montoBase: 100,
    moneda: 'USD' as const,
    fecha: '2026-08-31',
  };

  it('rechaza con 409 si el trabajador está inactivo y no se confirma', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findFirst.mockResolvedValue({ id: 'trab-1', estado: 'INACTIVO' });

    await expect(service.confirmarPago(TENANT_A, 'trab-1', dto, 'user-1')).rejects.toThrow(ConflictException);
    expect(prisma.pago.create).not.toHaveBeenCalled();
  });

  it('con confirmar:true registra el pago aunque el trabajador esté inactivo', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findFirst.mockResolvedValue({ id: 'trab-1', estado: 'INACTIVO' });
    prisma.pago.create.mockResolvedValue({ id: 'pago-1' });

    await service.confirmarPago(TENANT_A, 'trab-1', { ...dto, confirmar: true }, 'user-1');

    expect(prisma.pago.create).toHaveBeenCalled();
  });

  it('rechaza con 400 si el descuento de un adelanto supera su saldo pendiente', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findFirst.mockResolvedValue({ id: 'trab-1', estado: 'ACTIVO' });
    prisma.adelanto.findFirst = jest.fn().mockResolvedValue({ id: 'adel-1', monto: '50', montoDescontado: '0' });

    await expect(
      service.confirmarPago(
        TENANT_A,
        'trab-1',
        { ...dto, adelantos: [{ adelantoId: 'adel-1', monto: 100 }] },
        'user-1',
      ),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.pago.create).not.toHaveBeenCalled();
  });

  it('calcula montoTotal descontando adelantos/préstamos y bonificaciones/otros descuentos', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findFirst.mockResolvedValue({ id: 'trab-1', estado: 'ACTIVO' });
    prisma.adelanto.findFirst = jest.fn().mockResolvedValue({ id: 'adel-1', monto: '50', montoDescontado: '0' });
    prisma.prestamo.findFirst = jest
      .fn()
      .mockResolvedValue({ id: 'prest-1', montoOriginal: '200', abonos: [] });
    prisma.pago.create.mockResolvedValue({ id: 'pago-1' });

    await service.confirmarPago(
      TENANT_A,
      'trab-1',
      {
        ...dto,
        montoBase: 390,
        bonificaciones: 50,
        otrosDescuentos: 10,
        adelantos: [{ adelantoId: 'adel-1', monto: 30 }],
        prestamos: [{ prestamoId: 'prest-1', monto: 100 }],
      },
      'user-1',
    );

    expect(prisma.pago.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          montoBase: 390,
          bonificaciones: 50,
          adelantosDescontados: 30,
          prestamosDescontados: 100,
          otrosDescuentos: 10,
          montoTotal: 300, // 390 + 50 - 30 - 100 - 10
        }),
      }),
    );
  });

  it('incrementa adelanto.montoDescontado y crea un prestamoAbono con pagoId', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findFirst.mockResolvedValue({ id: 'trab-1', estado: 'ACTIVO' });
    prisma.adelanto.findFirst = jest.fn().mockResolvedValue({ id: 'adel-1', monto: '50', montoDescontado: '0' });
    prisma.prestamo.findFirst = jest
      .fn()
      .mockResolvedValue({ id: 'prest-1', montoOriginal: '200', abonos: [] });
    prisma.pago.create.mockResolvedValue({ id: 'pago-1' });

    await service.confirmarPago(
      TENANT_A,
      'trab-1',
      {
        ...dto,
        adelantos: [{ adelantoId: 'adel-1', monto: 30 }],
        prestamos: [{ prestamoId: 'prest-1', monto: 100 }],
      },
      'user-1',
    );

    expect(prisma.adelanto.update).toHaveBeenCalledWith({
      where: { id: 'adel-1' },
      data: { montoDescontado: { increment: 30 } },
    });
    expect(prisma.prestamoAbono.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ prestamoId: 'prest-1', monto: 100, pagoId: 'pago-1' }),
    });
  });

  it('en VES calcula montoEquivalenteUsd sobre el monto total', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findFirst.mockResolvedValue({ id: 'trab-1', estado: 'ACTIVO' });
    prisma.pago.create.mockResolvedValue({ id: 'pago-1' });

    await service.confirmarPago(TENANT_A, 'trab-1', { ...dto, montoBase: 4000, moneda: 'VES', tasaCambio: 40 }, 'user-1');

    expect(prisma.pago.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tasaCambio: 40, montoEquivalenteUsd: 100 }),
      }),
    );
  });
});

describe('TrabajadoresService.obtenerReporte', () => {
  it('rechaza con 400 un tipo de reporte desconocido', async () => {
    const { service } = buildDeps();

    await expect(service.obtenerReporte(TENANT_A, 'inexistente', {})).rejects.toThrow(BadRequestException);
  });

  it('reporte de trabajadores cuenta activos/inactivos y agrupa por cargo', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.findMany.mockResolvedValue([
      { estado: 'ACTIVO', cargo: { nombre: 'Ordeñador' } },
      { estado: 'ACTIVO', cargo: { nombre: 'Ordeñador' } },
      { estado: 'INACTIVO', cargo: { nombre: 'Caporal' } },
    ]);

    const resultado = await service.obtenerReporte(TENANT_A, 'trabajadores', {});

    expect(resultado.resumen).toMatchObject({ Activos: 2, Inactivos: 1, Total: 3 });
    expect(resultado.tablas[0].filas).toEqual(
      expect.arrayContaining([
        ['Ordeñador', 2, 0, 2],
        ['Caporal', 0, 1, 1],
      ]),
    );
  });

  it('reporte de asistencia agrega jornadas/horas/ausencias dentro del rango', async () => {
    const { service, prisma } = buildDeps();
    prisma.asistencia.findMany.mockResolvedValue([
      { estado: 'PRESENTE', horaEntrada: '08:00', horaSalida: '12:00', trabajador: { nombres: 'Juan', apellidos: 'Pérez' } },
      { estado: 'PRESENTE', horaEntrada: null, horaSalida: null, trabajador: { nombres: 'Juan', apellidos: 'Pérez' } },
      { estado: 'AUSENTE', horaEntrada: null, horaSalida: null, trabajador: { nombres: 'Juan', apellidos: 'Pérez' } },
      { estado: 'PERMISO', horaEntrada: null, horaSalida: null, trabajador: { nombres: 'Ana', apellidos: 'Ruiz' } },
    ]);

    const resultado = await service.obtenerReporte(TENANT_A, 'asistencia', { desde: '2026-08-01', hasta: '2026-08-31' });

    expect(resultado.resumen).toMatchObject({
      Jornadas: 2,
      'Horas trabajadas': 4,
      Ausencias: 1,
      Permisos: 1,
    });
    expect(resultado.tablas[0].filas).toEqual(
      expect.arrayContaining([
        ['Juan Pérez', 2, 4, 1],
        ['Ana Ruiz', 0, 0, 0],
      ]),
    );
  });

  it('reporte de pagos convierte VES a equivalente USD y agrupa por concepto', async () => {
    const { service, prisma } = buildDeps();
    prisma.pago.findMany.mockResolvedValue([
      {
        moneda: 'USD',
        montoTotal: '100',
        montoEquivalenteUsd: null,
        tipo: 'SALARIO',
        trabajador: { nombres: 'Juan', apellidos: 'Pérez' },
      },
      {
        moneda: 'VES',
        montoTotal: '4000',
        montoEquivalenteUsd: '100',
        tipo: 'BONO',
        trabajador: { nombres: 'Juan', apellidos: 'Pérez' },
      },
    ]);

    const resultado = await service.obtenerReporte(TENANT_A, 'pagos', {});

    expect(resultado.resumen).toMatchObject({ 'Total pagado (USD equiv.)': 200, 'Cantidad de pagos': 2 });
    const porConcepto = resultado.tablas.find((t) => t.titulo === 'Por concepto')!;
    expect(porConcepto.filas).toEqual(expect.arrayContaining([['SALARIO', 100], ['BONO', 100]]));
  });

  it('reporte de costo laboral parte salarios/bonos/otros correctamente', async () => {
    const { service, prisma } = buildDeps();
    prisma.trabajador.count.mockResolvedValue(5);
    prisma.asistencia.findMany.mockResolvedValue([
      { estado: 'PRESENTE', jornalRealizado: '1' },
      { estado: 'PRESENTE', jornalRealizado: '1' },
    ]);
    prisma.pago.findMany.mockResolvedValue([
      { moneda: 'USD', montoTotal: '100', montoEquivalenteUsd: null, tipo: 'SALARIO', fecha: new Date('2026-08-05') },
      { moneda: 'USD', montoTotal: '50', montoEquivalenteUsd: null, tipo: 'BONO', fecha: new Date('2026-08-10') },
      { moneda: 'USD', montoTotal: '20', montoEquivalenteUsd: null, tipo: 'OTRO', fecha: new Date('2026-08-15') },
    ]);

    const resultado = await service.obtenerReporte(TENANT_A, 'costo-laboral', {
      desde: '2026-08-01',
      hasta: '2026-08-31',
    });

    expect(resultado.resumen).toMatchObject({
      'Trabajadores activos': 5,
      'Jornadas del período': 2,
      'Jornales realizados': 2,
      'Total salarios (USD equiv.)': 100,
      'Total bonos (USD equiv.)': 50,
      'Otros pagos (USD equiv.)': 20,
      'Costo laboral total (USD equiv.)': 170,
    });
  });
});

describe('TrabajadoresService.exportarReporte', () => {
  it('genera CSV llamando a exportService.renderCsv', async () => {
    const { service, prisma, exportService } = buildDeps();
    prisma.trabajador.findMany.mockResolvedValue([]);

    const resultado = await service.exportarReporte(TENANT_A, 'trabajadores', { formato: 'csv' });

    expect(exportService.renderCsv).toHaveBeenCalled();
    expect(resultado.contentType).toBe('text/csv');
  });

  it('genera XLSX llamando a exportService.renderXlsx', async () => {
    const { service, prisma, exportService } = buildDeps();
    prisma.trabajador.findMany.mockResolvedValue([]);

    const resultado = await service.exportarReporte(TENANT_A, 'trabajadores', { formato: 'xlsx' });

    expect(exportService.renderXlsx).toHaveBeenCalled();
    expect(resultado.contentType).toContain('spreadsheetml');
  });

  it('genera PDF llamando a exportService.renderPdf', async () => {
    const { service, prisma, exportService } = buildDeps();
    prisma.trabajador.findMany.mockResolvedValue([]);

    const resultado = await service.exportarReporte(TENANT_A, 'trabajadores', { formato: 'pdf' });

    expect(exportService.renderPdf).toHaveBeenCalled();
    expect(resultado.contentType).toBe('application/pdf');
  });
});
