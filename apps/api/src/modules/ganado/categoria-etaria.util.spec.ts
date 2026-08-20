import { Especie, SexoAnimal } from '@prisma/client';
import { calcularCategoriaEtaria } from './categoria-etaria.util';

const HOY = new Date('2026-08-20T00:00:00Z');

function haceMeses(meses: number): Date {
  const fecha = new Date(HOY);
  fecha.setMonth(fecha.getMonth() - meses);
  return fecha;
}

describe('calcularCategoriaEtaria', () => {
  it('devuelve null sin fecha de nacimiento', () => {
    expect(calcularCategoriaEtaria(null, SexoAnimal.HEMBRA, Especie.BOVINO, HOY)).toBeNull();
  });

  it('clasifica como Ternero/a por debajo de 12 meses', () => {
    expect(calcularCategoriaEtaria(haceMeses(6), SexoAnimal.MACHO, Especie.BOVINO, HOY)).toBe(
      'Ternero',
    );
    expect(calcularCategoriaEtaria(haceMeses(11), SexoAnimal.HEMBRA, Especie.BOVINO, HOY)).toBe(
      'Ternera',
    );
  });

  it('el borde exacto de 12 meses ya es Novillo/a, no Ternero/a', () => {
    expect(calcularCategoriaEtaria(haceMeses(12), SexoAnimal.MACHO, Especie.BOVINO, HOY)).toBe(
      'Novillo',
    );
  });

  it('clasifica como Novillo/a entre 12 y 24 meses', () => {
    expect(calcularCategoriaEtaria(haceMeses(18), SexoAnimal.HEMBRA, Especie.BOVINO, HOY)).toBe(
      'Novilla',
    );
  });

  it('el borde exacto de 24 meses ya es Toro/Vaca, no Novillo/a', () => {
    expect(calcularCategoriaEtaria(haceMeses(24), SexoAnimal.HEMBRA, Especie.BOVINO, HOY)).toBe(
      'Vaca',
    );
  });

  it('clasifica como Toro/Vaca desde los 24 meses', () => {
    expect(calcularCategoriaEtaria(haceMeses(48), SexoAnimal.MACHO, Especie.BOVINO, HOY)).toBe(
      'Toro',
    );
  });

  it('agrega sufijo "bufalino" para especie BUFALINO', () => {
    expect(calcularCategoriaEtaria(haceMeses(48), SexoAnimal.MACHO, Especie.BUFALINO, HOY)).toBe(
      'Toro bufalino',
    );
  });
});
