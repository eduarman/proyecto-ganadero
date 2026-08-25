import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Especie, SexoAnimal } from '@prisma/client';
import { GanadoService } from './ganado.service';

function buildDeps() {
  const prisma = {
    animal: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    animalBaja: {
      create: jest.fn(),
    },
    servicio: {
      findFirst: jest.fn(),
    },
    potrero: {
      findFirst: jest.fn(),
    },
    animalMovimiento: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const potrerosService = {
    validarCapacidad: jest.fn(),
  };

  const service = new GanadoService(prisma as any, potrerosService as any);
  return { service, prisma, potrerosService };
}

const TENANT_A = 'tenant-a';
const TENANT_B = 'tenant-b';

describe('GanadoService.crear', () => {
  it('rechaza con 409 si el identificador ya existe en el mismo tenant', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findUnique.mockResolvedValue({ id: 'existing', identificador: '001' });

    await expect(
      service.crear(TENANT_A, {
        identificador: '001',
        especie: Especie.BOVINO,
        sexo: SexoAnimal.HEMBRA,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('calcula la categoría etaria sugerida cuando no viene explícita', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findUnique.mockResolvedValue(null);
    prisma.animal.create.mockResolvedValue({ id: 'new' });

    await service.crear(TENANT_A, {
      identificador: '002',
      especie: Especie.BOVINO,
      sexo: SexoAnimal.MACHO,
      fechaNacimiento: '2026-01-01',
    });

    expect(prisma.animal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tenantId: TENANT_A, categoria: expect.any(String) }),
      }),
    );
  });

  it('respeta una categoría explícita en vez de la sugerida', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findUnique.mockResolvedValue(null);
    prisma.animal.create.mockResolvedValue({ id: 'new' });

    await service.crear(TENANT_A, {
      identificador: '003',
      especie: Especie.BOVINO,
      sexo: SexoAnimal.MACHO,
      categoria: 'Toro reproductor',
    });

    expect(prisma.animal.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ categoria: 'Toro reproductor' }) }),
    );
  });

  it('rechaza con 404 si la madre indicada no existe en el tenant', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findUnique.mockResolvedValue(null);
    prisma.animal.findFirst.mockResolvedValue(null);

    await expect(
      service.crear(TENANT_A, {
        identificador: '004',
        especie: Especie.BOVINO,
        sexo: SexoAnimal.MACHO,
        madreId: 'madre-inexistente',
      }),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.animal.create).not.toHaveBeenCalled();
  });

  it('rechaza con 400 si el animal indicado como madre no es hembra', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findUnique.mockResolvedValue(null);
    prisma.animal.findFirst.mockResolvedValue({ id: 'madre-1', sexo: 'MACHO' });

    await expect(
      service.crear(TENANT_A, {
        identificador: '005',
        especie: Especie.BOVINO,
        sexo: SexoAnimal.MACHO,
        madreId: 'madre-1',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('vincula madre y padre cuando ambos existen en el tenant con el sexo correcto', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findUnique.mockResolvedValue(null);
    prisma.animal.findFirst
      .mockResolvedValueOnce({ id: 'madre-1', sexo: 'HEMBRA' })
      .mockResolvedValueOnce({ id: 'padre-1', sexo: 'MACHO' });
    prisma.animal.create.mockResolvedValue({ id: 'cria-1' });

    await service.crear(TENANT_A, {
      identificador: '006',
      especie: Especie.BOVINO,
      sexo: SexoAnimal.HEMBRA,
      madreId: 'madre-1',
      padreId: 'padre-1',
    });

    expect(prisma.animal.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ madreId: 'madre-1', padreId: 'padre-1' }) }),
    );
  });
});

describe('GanadoService.listar', () => {
  it('filtra siempre por tenantId, incluso con otros filtros vacíos', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findMany.mockResolvedValue([]);
    prisma.animal.count.mockResolvedValue(0);

    await service.listar(TENANT_B, { page: 1, limit: 20 });

    expect(prisma.animal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: TENANT_B } }),
    );
  });

  it('filtra por potrero actual cuando se indica', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findMany.mockResolvedValue([]);
    prisma.animal.count.mockResolvedValue(0);

    await service.listar(TENANT_A, { page: 1, limit: 20, potreroActualId: 'potrero-1' });

    expect(prisma.animal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ potreroActualId: 'potrero-1' }) }),
    );
  });

  it('traduce el rango de edad en meses a un rango de fechaNacimiento', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findMany.mockResolvedValue([]);
    prisma.animal.count.mockResolvedValue(0);

    await service.listar(TENANT_A, { page: 1, limit: 20, edadMinMeses: 12, edadMaxMeses: 24 });

    const llamada = prisma.animal.findMany.mock.calls[0][0];
    expect(llamada.where.fechaNacimiento.gte).toBeInstanceOf(Date);
    expect(llamada.where.fechaNacimiento.lte).toBeInstanceOf(Date);
    // edadMinMeses (12) -> nació antes que edadMaxMeses (24) -> nació después
    expect(llamada.where.fechaNacimiento.gte.getTime()).toBeLessThan(llamada.where.fechaNacimiento.lte.getTime());
  });
});

describe('GanadoService.obtener', () => {
  it('lanza 404 si el animal no existe o pertenece a otro tenant', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findFirst.mockResolvedValue(null);

    await expect(service.obtener(TENANT_A, 'algun-id')).rejects.toThrow(NotFoundException);
    expect(prisma.animal.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'algun-id', tenantId: TENANT_A } }),
    );
  });
});

describe('GanadoService.darBaja', () => {
  it('marca estado=INACTIVO y crea el registro de baja dentro de una transacción', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findFirst.mockResolvedValue({ id: 'animal-1' });
    prisma.servicio.findFirst.mockResolvedValue(null);
    prisma.$transaction.mockResolvedValue([{ id: 'animal-1' }, { id: 'baja-1' }]);

    const resultado = await service.darBaja(
      TENANT_A,
      'animal-1',
      { motivo: 'VENTA', fecha: '2026-08-20' },
      'usuario-1',
    );

    expect(resultado).toEqual({ id: 'baja-1' });
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('rechaza con 409 si el animal tiene un servicio reproductivo sin cerrar (US-4.3)', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findFirst.mockResolvedValue({ id: 'animal-1' });
    prisma.servicio.findFirst.mockResolvedValue({ id: 'servicio-1' });

    await expect(
      service.darBaja(TENANT_A, 'animal-1', { motivo: 'VENTA', fecha: '2026-08-20' }, 'usuario-1'),
    ).rejects.toThrow(ConflictException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('permite confirmar la baja igual con confirmarConEventosPendientes, sin volver a chequear', async () => {
    const { service, prisma } = buildDeps();
    prisma.animal.findFirst.mockResolvedValue({ id: 'animal-1' });
    prisma.$transaction.mockResolvedValue([{ id: 'animal-1' }, { id: 'baja-1' }]);

    await service.darBaja(
      TENANT_A,
      'animal-1',
      { motivo: 'VENTA', fecha: '2026-08-20', confirmarConEventosPendientes: true },
      'usuario-1',
    );

    expect(prisma.servicio.findFirst).not.toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});

describe('GanadoService.moverAnimales', () => {
  const dto = { animalIds: ['animal-1'], potreroDestinoId: 'potrero-2', fecha: '2026-08-22' };

  it('lanza 404 si el potrero destino no existe en el tenant', async () => {
    const { service, prisma } = buildDeps();
    prisma.potrero.findFirst.mockResolvedValue(null);

    await expect(service.moverAnimales(TENANT_A, dto, 'usuario-1')).rejects.toThrow(NotFoundException);
  });

  it('rechaza mover animales a un potrero inactivo', async () => {
    const { service, prisma } = buildDeps();
    prisma.potrero.findFirst.mockResolvedValue({ id: 'potrero-2', estado: 'INACTIVO' });

    await expect(service.moverAnimales(TENANT_A, dto, 'usuario-1')).rejects.toThrow(BadRequestException);
  });

  it('lanza 404 si alguno de los animales no existe en el tenant', async () => {
    const { service, prisma } = buildDeps();
    prisma.potrero.findFirst.mockResolvedValue({ id: 'potrero-2', estado: 'ACTIVO' });
    prisma.animal.findMany.mockResolvedValue([]);

    await expect(service.moverAnimales(TENANT_A, dto, 'usuario-1')).rejects.toThrow(NotFoundException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rechaza mover animales dados de baja', async () => {
    const { service, prisma } = buildDeps();
    prisma.potrero.findFirst.mockResolvedValue({ id: 'potrero-2', estado: 'ACTIVO' });
    prisma.animal.findMany.mockResolvedValue([{ id: 'animal-1', estado: 'INACTIVO' }]);

    await expect(service.moverAnimales(TENANT_A, dto, 'usuario-1')).rejects.toThrow(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('crea un movimiento por animal con el potrero de origen correcto y actualiza su potrero actual', async () => {
    const { service, prisma, potrerosService } = buildDeps();
    prisma.potrero.findFirst.mockResolvedValue({ id: 'potrero-2', estado: 'ACTIVO' });
    prisma.animal.findMany.mockResolvedValue([
      { id: 'animal-1', potreroActualId: 'potrero-1', estado: 'ACTIVO' },
      { id: 'animal-2', potreroActualId: null, estado: 'ACTIVO' },
    ]);
    potrerosService.validarCapacidad.mockResolvedValue({ excede: false });
    prisma.$transaction.mockImplementation((ops: any[]) => Promise.all(ops));
    prisma.animalMovimiento.create.mockImplementation(({ data }: any) => Promise.resolve({ id: `mov-${data.animalId}`, ...data }));
    prisma.animal.update.mockResolvedValue({});

    const resultado = await service.moverAnimales(
      TENANT_A,
      { animalIds: ['animal-1', 'animal-2'], potreroDestinoId: 'potrero-2', fecha: '2026-08-22' },
      'usuario-1',
    );

    expect(resultado).toHaveLength(2);
    expect(prisma.animalMovimiento.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ animalId: 'animal-1', potreroOrigenId: 'potrero-1', potreroDestinoId: 'potrero-2' }) }),
    );
    expect(prisma.animalMovimiento.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ animalId: 'animal-2', potreroOrigenId: null }) }),
    );
    expect(prisma.animal.update).toHaveBeenCalledWith({
      where: { id: 'animal-1' },
      data: { potreroActualId: 'potrero-2' },
    });
  });

  it('rechaza con 409 POTRERO_SOBRECARGADO si el destino excede su capacidad (US-2.2)', async () => {
    const { service, prisma, potrerosService } = buildDeps();
    prisma.potrero.findFirst.mockResolvedValue({ id: 'potrero-2', estado: 'ACTIVO' });
    prisma.animal.findMany.mockResolvedValue([{ id: 'animal-1', potreroActualId: 'potrero-1', estado: 'ACTIVO' }]);
    potrerosService.validarCapacidad.mockResolvedValue({
      excede: true,
      ocupacionActual: 10,
      capacidadCarga: 10,
      ocupacionResultante: 11,
    });

    await expect(service.moverAnimales(TENANT_A, dto, 'usuario-1')).rejects.toThrow(ConflictException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('permite mover igual con confirmarSobrecapacidad, sin volver a chequear la capacidad', async () => {
    const { service, prisma, potrerosService } = buildDeps();
    prisma.potrero.findFirst.mockResolvedValue({ id: 'potrero-2', estado: 'ACTIVO' });
    prisma.animal.findMany.mockResolvedValue([{ id: 'animal-1', potreroActualId: 'potrero-1', estado: 'ACTIVO' }]);
    prisma.$transaction.mockImplementation((ops: any[]) => Promise.all(ops));
    prisma.animalMovimiento.create.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: `mov-${data.animalId}`, ...data }),
    );
    prisma.animal.update.mockResolvedValue({});

    await service.moverAnimales(TENANT_A, { ...dto, confirmarSobrecapacidad: true }, 'usuario-1');

    expect(potrerosService.validarCapacidad).not.toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
