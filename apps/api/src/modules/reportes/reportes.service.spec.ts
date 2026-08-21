import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ReportesService } from './reportes.service';

function buildDeps() {
  const prisma = {
    animal: { findMany: jest.fn().mockResolvedValue([]) },
    parto: { findMany: jest.fn().mockResolvedValue([]) },
    animalBaja: { findMany: jest.fn().mockResolvedValue([]) },
    registroLeche: { findMany: jest.fn().mockResolvedValue([]) },
    registroLecheTotal: { findMany: jest.fn().mockResolvedValue([]) },
    suministro: { findMany: jest.fn().mockResolvedValue([]) },
    reporteGenerado: { create: jest.fn(), update: jest.fn(), findFirst: jest.fn(), findMany: jest.fn() },
    negocio: { findUnique: jest.fn() },
  };
  const alimentacionService = {
    costos: jest.fn().mockResolvedValue({ porTipo: [], consumoTotalKg: 0, costoTotalGeneral: 0, costoParcial: false }),
  };
  const potrerosService = { listar: jest.fn().mockResolvedValue([]) };
  const sanidadService = { cumplimiento: jest.fn().mockResolvedValue({ total: 0, vencidas: 0, alDia: 0, porcentajeAlDia: 100 }) };
  const exportService = { renderXlsx: jest.fn().mockResolvedValue(Buffer.from('xlsx')), renderPdf: jest.fn().mockResolvedValue(Buffer.from('pdf')) };
  const storageService = { subir: jest.fn().mockResolvedValue(undefined), firmarUrl: jest.fn().mockResolvedValue('https://signed.url/x') };

  const service = new ReportesService(
    prisma as any,
    alimentacionService as any,
    potrerosService as any,
    sanidadService as any,
    exportService as any,
    storageService as any,
  );

  return { service, prisma, alimentacionService, potrerosService, sanidadService, exportService, storageService };
}

const TENANT_A = 'tenant-a';

describe('ReportesService.tipos', () => {
  it('limita el catálogo a cumplimiento_sanitario para VETERINARIO_EXTERNO', async () => {
    const { service } = buildDeps();

    const resultado = await service.tipos(TENANT_A, 'VETERINARIO_EXTERNO');

    expect(resultado.tipos).toHaveLength(1);
    expect(resultado.tipos[0].tipo).toBe('CUMPLIMIENTO_SANITARIO');
    expect(resultado.consolidadoDisponible).toBe(false);
  });

  it('devuelve el catálogo completo para MAYORDOMO', async () => {
    const { service } = buildDeps();

    const resultado = await service.tipos(TENANT_A, 'MAYORDOMO');

    expect(resultado.tipos.length).toBeGreaterThan(1);
  });
});

describe('ReportesService.generar', () => {
  const dto = { formato: 'XLSX' as const };

  it('rechaza un tipo inexistente', async () => {
    const { service, prisma } = buildDeps();

    await expect(service.generar(TENANT_A, 'no_existe', dto, 'usuario-1', 'ADMIN_NEGOCIO')).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.reporteGenerado.create).not.toHaveBeenCalled();
  });

  it('rechaza a VETERINARIO_EXTERNO pedir un reporte que no sea cumplimiento_sanitario', async () => {
    const { service } = buildDeps();

    await expect(
      service.generar(TENANT_A, 'produccion', dto, 'usuario-1', 'VETERINARIO_EXTERNO'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('marca el reporte como LISTO y sube el archivo cuando todo sale bien', async () => {
    const { service, prisma, storageService } = buildDeps();
    prisma.reporteGenerado.create.mockResolvedValue({ id: 'reporte-1' });
    prisma.reporteGenerado.update.mockResolvedValue({ id: 'reporte-1', estado: 'LISTO' });

    const resultado = await service.generar(TENANT_A, 'ocupacion_potreros', dto, 'usuario-1', 'ADMIN_NEGOCIO');

    expect(storageService.subir).toHaveBeenCalled();
    expect(prisma.reporteGenerado.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ estado: 'LISTO' }) }),
    );
    expect(resultado.archivoUrl).toBe('https://signed.url/x');
  });

  it('marca el reporte como ERROR sin perder el registro si falla el storage', async () => {
    const { service, prisma, storageService } = buildDeps();
    prisma.reporteGenerado.create.mockResolvedValue({ id: 'reporte-1' });
    storageService.subir.mockRejectedValue(new Error('bucket no configurado'));

    await expect(service.generar(TENANT_A, 'ocupacion_potreros', dto, 'usuario-1', 'ADMIN_NEGOCIO')).rejects.toThrow(
      'bucket no configurado',
    );

    expect(prisma.reporteGenerado.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ estado: 'ERROR', errorMensaje: 'bucket no configurado' }) }),
    );
  });
});

describe('ReportesService.consolidado', () => {
  it('rechaza con 403 si el plan de la cuenta no permite multi-negocio', async () => {
    const { service, prisma } = buildDeps();
    prisma.negocio.findUnique.mockResolvedValue({
      id: TENANT_A,
      cuenta: { plan: { maxNegocios: 1 }, negocios: [{ id: TENANT_A, nombre: 'Negocio 1' }] },
    });

    await expect(service.consolidado(TENANT_A, 'produccion', {})).rejects.toThrow(ForbiddenException);
  });

  it('agrega datos de todos los negocios de la cuenta con desglose explícito cuando el plan lo permite', async () => {
    const { service, prisma } = buildDeps();
    prisma.negocio.findUnique.mockResolvedValue({
      id: TENANT_A,
      cuenta: {
        plan: { maxNegocios: 5 },
        negocios: [
          { id: 'tenant-a', nombre: 'Negocio A' },
          { id: 'tenant-b', nombre: 'Negocio B' },
        ],
      },
    });

    const resultado = await service.consolidado(TENANT_A, 'ocupacion_potreros', {});

    expect(resultado.negocios).toHaveLength(2);
    expect(resultado.negocios[0]).toMatchObject({ negocioId: 'tenant-a', negocioNombre: 'Negocio A' });
    expect(resultado.negocios[1]).toMatchObject({ negocioId: 'tenant-b', negocioNombre: 'Negocio B' });
  });
});

describe('ReportesService.consolidadoDisponible', () => {
  it('es true solo cuando el plan de la cuenta admite más de un negocio', async () => {
    const { service, prisma } = buildDeps();
    prisma.negocio.findUnique.mockResolvedValue({ cuenta: { plan: { maxNegocios: 5 } } });

    await expect(service.consolidadoDisponible(TENANT_A)).resolves.toBe(true);
  });
});

describe('ReportesService.obtenerDatos — natalidad_mortalidad', () => {
  it('agrupa nacimientos y muertes por mes dentro del rango', async () => {
    const { service, prisma } = buildDeps();
    prisma.parto.findMany.mockResolvedValue([{ fecha: new Date('2026-06-15') }, { fecha: new Date('2026-06-20') }]);
    prisma.animalBaja.findMany.mockResolvedValue([{ fecha: new Date('2026-06-10') }]);

    const datos = await service.obtenerDatos('NATALIDAD_MORTALIDAD', { desde: '2026-06-01', hasta: '2026-06-30' }, TENANT_A);

    expect(datos.resumen.Nacimientos).toBe(2);
    expect(datos.resumen.Muertes).toBe(1);
  });
});

describe('ReportesService.obtenerDatos — ocupacion_potreros', () => {
  it('reusa la clasificación compartida de ocupación', async () => {
    const { service, potrerosService } = buildDeps();
    potrerosService.listar.mockResolvedValue([
      { nombre: 'P1', estado: 'ACTIVO', capacidadCarga: 10, ocupacionActual: 12 },
    ]);

    const datos = await service.obtenerDatos('OCUPACION_POTREROS', {}, TENANT_A);

    expect(datos.resumen.Sobrecargado).toBe(1);
  });
});
