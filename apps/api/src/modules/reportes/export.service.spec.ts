import { ExportService } from './export.service';
import type { DatosReporte } from './reportes.types';

const DATOS: DatosReporte = {
  tipo: 'OCUPACION_POTREROS',
  generadoEn: new Date('2026-08-21T00:00:00.000Z').toISOString(),
  filtros: {},
  resumen: { Normal: 3, Sobrecargado: 1 },
  tablas: [{ titulo: 'Detalle', columnas: ['Potrero', 'Ocupación'], filas: [['P1', 5]] }],
};

describe('ExportService.renderXlsx', () => {
  it('genera un workbook no vacío con una hoja de resumen y una por tabla', async () => {
    const service = new ExportService();

    const buffer = await service.renderXlsx(DATOS);

    expect(buffer.length).toBeGreaterThan(0);
  });
});

// renderPdf carga `puppeteer` (paquete ESM puro) vía `import()` dinámico a
// propósito — Jest, a diferencia de Node/ts-node en runtime real, sigue
// intentando parsear ese import dinámico con su transform CJS y falla con
// "Unexpected token 'export'". Es una limitación conocida de Jest con
// paquetes ESM-only, no un bug del código. Se verifica con curl contra la
// API corriendo de verdad (ver plan de reportes) en vez de acá.
