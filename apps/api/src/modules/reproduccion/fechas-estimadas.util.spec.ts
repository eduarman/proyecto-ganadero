import { Especie } from '@prisma/client';
import { calcularFechaEstimadaDiagnostico, calcularFechaProbableParto } from './fechas-estimadas.util';

describe('calcularFechaEstimadaDiagnostico', () => {
  it('suma 35 días a la fecha del servicio', () => {
    expect(calcularFechaEstimadaDiagnostico(new Date('2026-01-01'))).toEqual(new Date('2026-02-05'));
  });
});

describe('calcularFechaProbableParto', () => {
  it('suma 283 días para bovino', () => {
    expect(calcularFechaProbableParto(new Date('2026-01-01'), Especie.BOVINO)).toEqual(
      new Date('2026-10-11'),
    );
  });

  it('suma 310 días para bufalino', () => {
    expect(calcularFechaProbableParto(new Date('2026-01-01'), Especie.BUFALINO)).toEqual(
      new Date('2026-11-07'),
    );
  });
});
