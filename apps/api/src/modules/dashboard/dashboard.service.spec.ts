import { DashboardService } from './dashboard.service';

function buildDeps() {
  const prisma = {
    animal: { findMany: jest.fn().mockResolvedValue([]) },
    registroLeche: { findMany: jest.fn().mockResolvedValue([]) },
    registroLecheTotal: { findMany: jest.fn().mockResolvedValue([]) },
  };
  const produccionService = {
    indicadores: jest.fn().mockResolvedValue({ totalHoy: 0, promedioHoy: 0, animalesHoy: 0, variacionMensualPct: null, meses: [] }),
  };
  const potrerosService = { listar: jest.fn().mockResolvedValue([]) };
  const sanidadService = { alertas: jest.fn().mockResolvedValue([]) };
  const reproduccionService = {
    contarPrenadas: jest.fn().mockResolvedValue(0),
    calendario: jest.fn().mockResolvedValue({
      partosProximos: [],
      diagnosticosPendientes: [],
      celosEsperados: [],
      destetesSugeridos: [],
    }),
  };

  const service = new DashboardService(
    prisma as any,
    produccionService as any,
    potrerosService as any,
    sanidadService as any,
    reproduccionService as any,
  );

  return { service, prisma, produccionService, potrerosService, sanidadService, reproduccionService };
}

const TENANT_A = 'tenant-a';

describe('DashboardService.obtenerResumen', () => {
  it('arma el payload combinando las fuentes de todos los módulos', async () => {
    const { service, prisma, produccionService, reproduccionService } = buildDeps();
    prisma.animal.findMany.mockResolvedValue([
      { fechaNacimiento: null, sexo: 'HEMBRA', especie: 'BOVINO' },
      { fechaNacimiento: new Date('2020-01-01'), sexo: 'HEMBRA', especie: 'BOVINO' },
    ]);
    produccionService.indicadores.mockResolvedValue({ totalHoy: 84.5, promedioHoy: 8, animalesHoy: 10, variacionMensualPct: null, meses: [] });
    reproduccionService.contarPrenadas.mockResolvedValue(3);

    const resumen = await service.obtenerResumen(TENANT_A);

    expect(resumen.kpis.totalAnimales).toBe(2);
    expect(resumen.kpis.produccionHoy).toBe(84.5);
    expect(resumen.kpis.vacasPrenadas).toBe(3);
  });

  it('clasifica potreros por ocupación relativa a su capacidad de carga', async () => {
    const { service, potrerosService } = buildDeps();
    potrerosService.listar.mockResolvedValue([
      { estado: 'ACTIVO', capacidadCarga: 10, ocupacionActual: 5 }, // normal
      { estado: 'ACTIVO', capacidadCarga: 10, ocupacionActual: 9 }, // cerca del límite
      { estado: 'ACTIVO', capacidadCarga: 10, ocupacionActual: 12 }, // sobrecargado
      { estado: 'ACTIVO', capacidadCarga: null, ocupacionActual: 3 }, // sin capacidad cargada, se ignora
      { estado: 'INACTIVO', capacidadCarga: 10, ocupacionActual: 1 }, // inactivo, se ignora
    ]);

    const resumen = await service.obtenerResumen(TENANT_A);

    expect(resumen.kpis.ocupacionPotreros).toEqual({ normal: 1, cercaLimite: 1, sobrecargado: 1 });
  });

  it('ordena las alertas con las de urgencia alta primero', async () => {
    const { service, sanidadService, reproduccionService } = buildDeps();
    sanidadService.alertas.mockResolvedValue([
      {
        vencido: false,
        proximaFechaEsperada: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        producto: { nombre: 'Aftosa' },
        animal: { identificador: 'A001' },
      },
    ]);
    reproduccionService.calendario.mockResolvedValue({
      partosProximos: [
        {
          fechaProbableParto: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          animal: { identificador: 'A002' },
        },
      ],
      diagnosticosPendientes: [],
      celosEsperados: [],
      destetesSugeridos: [],
    });

    const resumen = await service.obtenerResumen(TENANT_A);

    expect(resumen.alertas[0].urgencia).toBe('alta');
    expect(resumen.alertas[0].tag).toBe('Parto');
    expect(resumen.alertas[0].linkTo).toBe('/reproduccion');
    expect(resumen.kpis.alertasSanitariasActivas).toBe(1);
  });

  it('arma el ranking de productividad a partir de los registros de leche de la última semana', async () => {
    const { service, prisma } = buildDeps();
    prisma.registroLeche.findMany.mockResolvedValue([
      { animalId: 'a1', fecha: new Date(), litros: 10, animal: { identificador: 'A001', raza: 'Holstein', potreroActual: { nombre: 'Potrero 1' } } },
      { animalId: 'a1', fecha: new Date(), litros: 5, animal: { identificador: 'A001', raza: 'Holstein', potreroActual: { nombre: 'Potrero 1' } } },
      { animalId: 'a2', fecha: new Date(), litros: 8, animal: { identificador: 'A002', raza: 'Jersey', potreroActual: null } },
    ]);

    const resumen = await service.obtenerResumen(TENANT_A);

    expect(resumen.ranking[0]).toMatchObject({ identificador: 'A001', litros: 15, pos: 1 });
    expect(resumen.ranking[1]).toMatchObject({ identificador: 'A002', litros: 8, pos: 2 });
  });
});
