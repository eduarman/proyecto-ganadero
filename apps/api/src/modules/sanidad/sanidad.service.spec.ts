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
    protocoloSanitario: {
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
    },
    diagnosticoSanitario: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    cuarentena: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    animal: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    aplicacionSanitaria: {
      create: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
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
    dosisAplicada: '2 ml IM',
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

    expect(resultado[0]).toMatchObject({ id: 'a1', vencido: true, tipo: 'REFUERZO' });
    expect(resultado[1]).toMatchObject({ id: 'a2', vencido: false, tipo: 'REFUERZO' });
  });

  it('agrega protocolos pendientes (US-1.2) para un animal sin aplicación previa, usando edadInicioDias', async () => {
    const { service, prisma } = buildDeps();
    const producto = { id: 'producto-1', nombre: 'Aftosa' };
    prisma.protocoloSanitario.findMany.mockResolvedValue([
      { id: 'protocolo-1', productoId: 'producto-1', edadInicioDias: 90, frecuenciaDias: null, especie: null, sexo: null, categoria: null, producto },
    ]);
    const nacimientoHace100Dias = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);
    prisma.animal.findMany.mockResolvedValue([
      { id: 'animal-1', identificador: '001', fechaNacimiento: nacimientoHace100Dias },
    ]);
    prisma.aplicacionSanitaria.findMany.mockResolvedValue([]);

    const resultado = await service.alertas(TENANT_A);

    const protocoloPendiente = resultado.find((r: any) => r.tipo === 'PROTOCOLO');
    expect(protocoloPendiente).toMatchObject({ tipo: 'PROTOCOLO', animal: { id: 'animal-1' }, vencido: true });
  });

  it('agrega protocolos pendientes para un animal con aplicación previa, usando frecuenciaDias', async () => {
    const { service, prisma } = buildDeps();
    const producto = { id: 'producto-1', nombre: 'Aftosa' };
    prisma.protocoloSanitario.findMany.mockResolvedValue([
      { id: 'protocolo-1', productoId: 'producto-1', edadInicioDias: null, frecuenciaDias: 5, especie: null, sexo: null, categoria: null, producto },
    ]);
    prisma.animal.findMany.mockResolvedValue([{ id: 'animal-1', identificador: '001', fechaNacimiento: null }]);
    const hace10Dias = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    prisma.aplicacionSanitaria.findMany.mockResolvedValue([
      { animalId: 'animal-1', fecha: hace10Dias },
    ]);

    const resultado = await service.alertas(TENANT_A);

    const protocoloPendiente = resultado.find((r: any) => r.tipo === 'PROTOCOLO');
    expect(protocoloPendiente).toMatchObject({ tipo: 'PROTOCOLO', animal: { id: 'animal-1' }, vencido: true });
  });

  it('no genera alerta de protocolo si ningún animal matchea el criterio', async () => {
    const { service, prisma } = buildDeps();
    prisma.protocoloSanitario.findMany.mockResolvedValue([
      { id: 'protocolo-1', productoId: 'producto-1', edadInicioDias: 90, frecuenciaDias: null, especie: 'BOVINO', sexo: null, categoria: null, producto: {} },
    ]);
    prisma.animal.findMany.mockResolvedValue([]);

    const resultado = await service.alertas(TENANT_A);

    expect(resultado.filter((r: any) => r.tipo === 'PROTOCOLO')).toHaveLength(0);
  });
});

describe('SanidadService.crearAplicacionLote', () => {
  const dto = {
    productoId: 'producto-1',
    fecha: '2026-08-22',
    animalIds: ['animal-1', 'animal-2'],
    dosisAplicada: '2 ml IM',
  };

  it('lanza 404 si el producto no existe en el tenant', async () => {
    const { service, prisma } = buildDeps();
    prisma.productoSanitario.findFirst.mockResolvedValue(null);

    await expect(service.crearAplicacionLote(TENANT_A, dto, 'user-1')).rejects.toThrow(NotFoundException);
  });

  it('lanza 404 si algún animal del lote no existe en el tenant', async () => {
    const { service, prisma } = buildDeps();
    prisma.productoSanitario.findFirst.mockResolvedValue({ id: 'producto-1', intervaloRefuerzoDias: null });
    prisma.animal.findMany.mockResolvedValue([{ id: 'animal-1' }]);

    await expect(service.crearAplicacionLote(TENANT_A, dto, 'user-1')).rejects.toThrow(NotFoundException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('crea una aplicación por animal dentro de una transacción', async () => {
    const { service, prisma } = buildDeps();
    prisma.productoSanitario.findFirst.mockResolvedValue({ id: 'producto-1', intervaloRefuerzoDias: 30 });
    prisma.animal.findMany.mockResolvedValue([{ id: 'animal-1' }, { id: 'animal-2' }]);
    prisma.$transaction.mockImplementation((ops: any[]) => Promise.all(ops));
    prisma.aplicacionSanitaria.create.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: `aplicacion-${data.animalId}`, ...data }),
    );

    const resultado = await service.crearAplicacionLote(TENANT_A, dto, 'user-1');

    expect(resultado).toHaveLength(2);
    expect(prisma.aplicacionSanitaria.create).toHaveBeenCalledTimes(2);
  });
});

describe('SanidadService.listar', () => {
  it('pagina el historial de aplicaciones', async () => {
    const { service, prisma } = buildDeps();
    prisma.aplicacionSanitaria.findMany.mockResolvedValue([{ id: 'a1' }]);
    prisma.aplicacionSanitaria.count.mockResolvedValue(1);

    const resultado = await service.listar(TENANT_A, { page: 2, limit: 10 });

    expect(resultado).toEqual({ data: [{ id: 'a1' }], total: 1, page: 2, limit: 10 });
    expect(prisma.aplicacionSanitaria.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
  });
});

describe('SanidadService.crearProtocolo', () => {
  it('lanza 404 si el producto no existe en el tenant', async () => {
    const { service, prisma } = buildDeps();
    prisma.productoSanitario.findFirst.mockResolvedValue(null);

    await expect(
      service.crearProtocolo(TENANT_A, { nombre: 'Refuerzo aftosa', productoId: 'producto-1' }),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('SanidadService.crearDiagnostico', () => {
  const dto = { animalId: 'animal-1', fecha: '2026-08-22', condicion: 'Mastitis', gravedad: 'MODERADA' as const };

  it('lanza 404 si el animal no existe en el tenant', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findFirst.mockResolvedValue(null);

    await expect(service.crearDiagnostico(TENANT_A, dto)).rejects.toThrow(NotFoundException);
  });

  it('lanza 404 si el tratamiento indicado no pertenece al mismo animal', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findFirst.mockResolvedValue({ id: 'animal-1' });
    prisma.aplicacionSanitaria.findFirst.mockResolvedValue(null);

    await expect(
      service.crearDiagnostico(TENANT_A, { ...dto, tratamientoAplicacionId: 'aplicacion-1' }),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('SanidadService.iniciarCuarentena / finalizarCuarentena', () => {
  const dto = { animalId: 'animal-1', fechaInicio: '2026-08-22', motivo: 'Sospecha de enfermedad' };

  it('lanza 404 si el animal no existe en el tenant', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findFirst.mockResolvedValue(null);

    await expect(service.iniciarCuarentena(TENANT_A, dto)).rejects.toThrow(NotFoundException);
  });

  it('rechaza con 409 si el animal ya tiene una cuarentena activa', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findFirst.mockResolvedValue({ id: 'animal-1' });
    prisma.cuarentena.findFirst.mockResolvedValue({ id: 'cuarentena-1' });

    await expect(service.iniciarCuarentena(TENANT_A, dto)).rejects.toThrow(ConflictException);
    expect(prisma.cuarentena.create).not.toHaveBeenCalled();
  });

  it('inicia la cuarentena cuando no hay ninguna activa para el animal', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findFirst.mockResolvedValue({ id: 'animal-1' });
    prisma.cuarentena.findFirst.mockResolvedValue(null);
    prisma.cuarentena.create.mockResolvedValue({ id: 'cuarentena-1' });

    await service.iniciarCuarentena(TENANT_A, dto);

    expect(prisma.cuarentena.create).toHaveBeenCalled();
  });

  it('finaliza una cuarentena marcando activa=false y fechaFinReal', async () => {
    const { service, prisma } = buildDeps();
    prisma.cuarentena.findFirst.mockResolvedValue({ id: 'cuarentena-1' });
    prisma.cuarentena.update.mockResolvedValue({ id: 'cuarentena-1', activa: false });

    await service.finalizarCuarentena(TENANT_A, 'cuarentena-1', {});

    expect(prisma.cuarentena.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'cuarentena-1' }, data: expect.objectContaining({ activa: false }) }),
    );
  });
});
