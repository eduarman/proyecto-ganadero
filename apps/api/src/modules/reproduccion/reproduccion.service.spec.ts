import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ReproduccionService } from './reproduccion.service';

function buildDeps() {
  const prisma = {
    animal: { findFirst: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    servicio: {
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
    },
    diagnosticoGestacion: { create: jest.fn() },
    parto: { create: jest.fn() },
    celo: { create: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    destete: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
    $transaction: jest.fn(),
  };

  const ganadoService = { crear: jest.fn() };

  const service = new ReproduccionService(prisma as any, ganadoService as any);
  return { service, prisma, ganadoService };
}

const TENANT_A = 'tenant-a';
const HEMBRA = { id: 'animal-1', sexo: 'HEMBRA', especie: 'BOVINO', identificador: '001', potreroActualId: null };

describe('ReproduccionService.crearServicio', () => {
  const dto = { animalId: 'animal-1', tipo: 'IA' as const, fecha: '2026-01-01' };

  it('lanza 404 si el animal no existe en el tenant', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findFirst.mockResolvedValue(null);

    await expect(service.crearServicio(TENANT_A, dto)).rejects.toThrow(NotFoundException);
  });

  it('rechaza si el animal es macho', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findFirst.mockResolvedValue({ ...HEMBRA, sexo: 'MACHO' });

    await expect(service.crearServicio(TENANT_A, dto)).rejects.toThrow(BadRequestException);
  });

  it('rechaza con 409 si ya hay un servicio activo y no se confirma duplicado', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findFirst.mockResolvedValue(HEMBRA);
    prisma.servicio.findFirst.mockResolvedValue({ id: 'servicio-existente' });

    await expect(service.crearServicio(TENANT_A, dto)).rejects.toThrow(ConflictException);
    expect(prisma.servicio.create).not.toHaveBeenCalled();
  });

  it('permite crear un nuevo servicio si confirmarDuplicado es true, aunque haya uno activo', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findFirst.mockResolvedValue(HEMBRA);
    prisma.servicio.create.mockResolvedValue({ id: 'servicio-nuevo' });

    await service.crearServicio(TENANT_A, { ...dto, confirmarDuplicado: true });

    expect(prisma.servicio.findFirst).not.toHaveBeenCalled();
    expect(prisma.servicio.create).toHaveBeenCalled();
  });

  it('calcula fechaEstimadaDiagnostico y fechaProbableParto según la especie', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findFirst.mockResolvedValue(HEMBRA);
    prisma.servicio.findFirst.mockResolvedValue(null);
    prisma.servicio.create.mockResolvedValue({ id: 'servicio-nuevo' });

    await service.crearServicio(TENANT_A, dto);

    const llamada = prisma.servicio.create.mock.calls[0][0];
    expect(llamada.data.fechaEstimadaDiagnostico).toEqual(new Date('2026-02-05'));
    expect(llamada.data.fechaProbableParto).toEqual(new Date('2026-10-11'));
  });
});

describe('ReproduccionService.crearDiagnostico', () => {
  it('lanza 404 si el servicio no existe en el tenant', async () => {
    const { service, prisma } = buildDeps();
    prisma.servicio.findFirst.mockResolvedValue(null);

    await expect(
      service.crearDiagnostico(TENANT_A, {
        servicioId: 'servicio-1',
        resultado: 'PRENADA',
        metodo: 'PALPACION',
        fecha: '2026-02-05',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('actualiza el servicio a CONFIRMADO_PRENADA cuando el resultado es PRENADA', async () => {
    const { service, prisma } = buildDeps();
    prisma.servicio.findFirst.mockResolvedValue({ id: 'servicio-1', estado: 'PENDIENTE_DIAGNOSTICO' });
    prisma.$transaction.mockImplementation((ops: any[]) => Promise.all(ops));
    prisma.servicio.update.mockResolvedValue({});
    prisma.diagnosticoGestacion.create.mockResolvedValue({ id: 'diag-1' });

    await service.crearDiagnostico(TENANT_A, {
      servicioId: 'servicio-1',
      resultado: 'PRENADA',
      metodo: 'PALPACION',
      fecha: '2026-02-05',
    });

    expect(prisma.servicio.update).toHaveBeenCalledWith({
      where: { id: 'servicio-1' },
      data: { estado: 'CONFIRMADO_PRENADA' },
    });
  });

  it('actualiza el servicio a VACIO cuando el resultado es VACIA (US-3.2)', async () => {
    const { service, prisma } = buildDeps();
    prisma.servicio.findFirst.mockResolvedValue({ id: 'servicio-1', estado: 'PENDIENTE_DIAGNOSTICO' });
    prisma.$transaction.mockImplementation((ops: any[]) => Promise.all(ops));
    prisma.servicio.update.mockResolvedValue({});
    prisma.diagnosticoGestacion.create.mockResolvedValue({ id: 'diag-1' });

    await service.crearDiagnostico(TENANT_A, {
      servicioId: 'servicio-1',
      resultado: 'VACIA',
      metodo: 'ECOGRAFIA',
      fecha: '2026-02-05',
    });

    expect(prisma.servicio.update).toHaveBeenCalledWith({
      where: { id: 'servicio-1' },
      data: { estado: 'VACIO' },
    });
  });

  it('no cambia el estado del servicio cuando el resultado es DUDOSO', async () => {
    const { service, prisma } = buildDeps();
    prisma.servicio.findFirst.mockResolvedValue({ id: 'servicio-1', estado: 'PENDIENTE_DIAGNOSTICO' });
    prisma.$transaction.mockImplementation((ops: any[]) => Promise.all(ops));
    prisma.servicio.update.mockResolvedValue({});
    prisma.diagnosticoGestacion.create.mockResolvedValue({ id: 'diag-1' });

    await service.crearDiagnostico(TENANT_A, {
      servicioId: 'servicio-1',
      resultado: 'DUDOSO',
      metodo: 'PALPACION',
      fecha: '2026-02-05',
    });

    expect(prisma.servicio.update).toHaveBeenCalledWith({
      where: { id: 'servicio-1' },
      data: { estado: 'PENDIENTE_DIAGNOSTICO' },
    });
  });
});

describe('ReproduccionService.crearParto', () => {
  it('lanza 404 si la madre no existe en el tenant', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findFirst.mockResolvedValue(null);

    await expect(
      service.crearParto(TENANT_A, { madreId: 'animal-1', fecha: '2026-10-11', tipo: 'NORMAL' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('da de alta la cría vía GanadoService cuando no es mortinato y viene identificador', async () => {
    const { service, prisma, ganadoService } = buildDeps();
    prisma.animal.findFirst.mockResolvedValue(HEMBRA);
    ganadoService.crear.mockResolvedValue({ id: 'cria-1' });
    prisma.parto.create.mockResolvedValue({ id: 'parto-1' });

    await service.crearParto(TENANT_A, {
      madreId: 'animal-1',
      fecha: '2026-10-11',
      tipo: 'NORMAL',
      criaIdentificador: 'CRIA-001',
      criaSexo: 'HEMBRA',
    });

    expect(ganadoService.crear).toHaveBeenCalledWith(
      TENANT_A,
      expect.objectContaining({ identificador: 'CRIA-001', madreRefExterna: '001' }),
    );
    expect(prisma.parto.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ criaAnimalId: 'cria-1' }) }),
    );
  });

  it('no da de alta ninguna cría cuando mortinato es true', async () => {
    const { service, prisma, ganadoService } = buildDeps();
    prisma.animal.findFirst.mockResolvedValue(HEMBRA);
    prisma.parto.create.mockResolvedValue({ id: 'parto-1' });

    await service.crearParto(TENANT_A, {
      madreId: 'animal-1',
      fecha: '2026-10-11',
      tipo: 'DISTOCICO',
      mortinato: true,
      criaIdentificador: 'CRIA-002',
    });

    expect(ganadoService.crear).not.toHaveBeenCalled();
    expect(prisma.parto.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ criaAnimalId: undefined, mortinato: true }) }),
    );
  });
});

describe('ReproduccionService.listarServicios', () => {
  it('filtra por animalId cuando se indica (ficha consolidada de ganado)', async () => {
    const { service, prisma } = buildDeps();
    prisma.servicio.findMany.mockResolvedValue([]);

    await service.listarServicios(TENANT_A, 'animal-1');

    expect(prisma.servicio.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: TENANT_A, animalId: 'animal-1' } }),
    );
  });

  it('no filtra por animal cuando no se indica', async () => {
    const { service, prisma } = buildDeps();
    prisma.servicio.findMany.mockResolvedValue([]);

    await service.listarServicios(TENANT_A);

    expect(prisma.servicio.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: TENANT_A } }),
    );
  });
});

describe('ReproduccionService.crearCelo', () => {
  const dto = { animalId: 'animal-1', fecha: '2026-01-01' };

  it('lanza 404 si el animal no existe en el tenant', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findFirst.mockResolvedValue(null);

    await expect(service.crearCelo(TENANT_A, dto)).rejects.toThrow(NotFoundException);
  });

  it('rechaza si el animal es macho', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findFirst.mockResolvedValue({ ...HEMBRA, sexo: 'MACHO' });

    await expect(service.crearCelo(TENANT_A, dto)).rejects.toThrow(BadRequestException);
  });

  it('crea el celo cuando el animal es una hembra válida', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findFirst.mockResolvedValue(HEMBRA);
    prisma.celo.create.mockResolvedValue({ id: 'celo-1' });

    await service.crearCelo(TENANT_A, dto);

    expect(prisma.celo.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ animalId: 'animal-1' }) }),
    );
  });
});

describe('ReproduccionService.crearDestete', () => {
  const dto = { animalId: 'animal-1', fecha: '2026-01-01' };

  it('lanza 404 si el animal no existe en el tenant', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findFirst.mockResolvedValue(null);

    await expect(service.crearDestete(TENANT_A, dto)).rejects.toThrow(NotFoundException);
  });

  it('rechaza con 409 si el animal ya tiene un destete registrado', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findFirst.mockResolvedValue(HEMBRA);
    prisma.destete.findUnique.mockResolvedValue({ id: 'destete-1' });

    await expect(service.crearDestete(TENANT_A, dto)).rejects.toThrow(ConflictException);
    expect(prisma.destete.create).not.toHaveBeenCalled();
  });

  it('crea el destete cuando no hay uno previo', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findFirst.mockResolvedValue(HEMBRA);
    prisma.destete.findUnique.mockResolvedValue(null);
    prisma.destete.create.mockResolvedValue({ id: 'destete-1' });

    await service.crearDestete(TENANT_A, { ...dto, pesoDestete: 120 });

    expect(prisma.destete.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ animalId: 'animal-1', pesoDestete: 120 }) }),
    );
  });
});

describe('ReproduccionService.calendario', () => {
  function mockServicioFindMany(prisma: any, opts: { pendientes?: any[]; porAnimal?: any[] } = {}) {
    prisma.servicio.findMany.mockImplementation(({ where }: any) => {
      if (where.estado === 'CONFIRMADO_PRENADA') return Promise.resolve([]);
      if (where.estado === 'PENDIENTE_DIAGNOSTICO') return Promise.resolve(opts.pendientes ?? []);
      if (where.animalId) return Promise.resolve(opts.porAnimal ?? []);
      return Promise.resolve([]);
    });
  }

  it('incluye un celo esperado cuando no hubo servicio posterior a ese celo', async () => {
    const { service, prisma } = buildDeps();
    mockServicioFindMany(prisma, { porAnimal: [] });
    const haceVeintidosDias = new Date(Date.now() - 22 * 24 * 60 * 60 * 1000);
    prisma.celo.findMany.mockResolvedValue([
      { id: 'celo-1', animalId: 'animal-1', fecha: haceVeintidosDias, animal: { id: 'animal-1', identificador: '001' } },
    ]);

    const resultado = await service.calendario(TENANT_A);

    expect(resultado.celosEsperados).toHaveLength(1);
    expect(resultado.celosEsperados[0]).toMatchObject({ animal: { identificador: '001' }, vencido: true });
  });

  it('no incluye el celo esperado si hubo un servicio posterior a ese celo', async () => {
    const { service, prisma } = buildDeps();
    const haceVeintidosDias = new Date(Date.now() - 22 * 24 * 60 * 60 * 1000);
    const haceDiezDias = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    mockServicioFindMany(prisma, { porAnimal: [{ animalId: 'animal-1', fecha: haceDiezDias }] });
    prisma.celo.findMany.mockResolvedValue([
      { id: 'celo-1', animalId: 'animal-1', fecha: haceVeintidosDias, animal: { id: 'animal-1', identificador: '001' } },
    ]);

    const resultado = await service.calendario(TENANT_A);

    expect(resultado.celosEsperados).toHaveLength(0);
  });

  it('sugiere destete para animales que superan la edad configurada sin destete registrado', async () => {
    const { service, prisma } = buildDeps();
    mockServicioFindMany(prisma);
    const nacimientoViejo = new Date(Date.now() - 300 * 24 * 60 * 60 * 1000);
    const nacimientoReciente = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    prisma.animal.findMany.mockResolvedValue([
      { id: 'animal-1', identificador: '001', fechaNacimiento: nacimientoViejo },
      { id: 'animal-2', identificador: '002', fechaNacimiento: nacimientoReciente },
    ]);
    prisma.destete.findMany.mockResolvedValue([]);

    const resultado = await service.calendario(TENANT_A);

    expect(resultado.destetesSugeridos).toHaveLength(1);
    expect(resultado.destetesSugeridos[0]).toMatchObject({ identificador: '001' });
  });

  it('marca vencido=true en un diagnóstico pendiente cuya fecha estimada ya pasó', async () => {
    const { service, prisma } = buildDeps();
    const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000);
    mockServicioFindMany(prisma, {
      pendientes: [{ id: 's1', fechaEstimadaDiagnostico: ayer, animal: { identificador: '001' } }],
    });

    const resultado = await service.calendario(TENANT_A);

    expect(resultado.diagnosticosPendientes[0]).toMatchObject({ vencido: true });
  });
});
