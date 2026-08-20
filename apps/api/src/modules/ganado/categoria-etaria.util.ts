import { Especie, SexoAnimal } from '@prisma/client';

const MESES_TERNERO = 12;
const MESES_NOVILLO = 24;

function mesesDeEdad(fechaNacimiento: Date, hoy: Date): number {
  const meses =
    (hoy.getFullYear() - fechaNacimiento.getFullYear()) * 12 +
    (hoy.getMonth() - fechaNacimiento.getMonth());
  return Math.max(0, meses);
}

// Heurística simple por edad/sexo (US-1.4) — es una sugerencia editable por
// el usuario, no reemplaza criterio veterinario ni estándares de manejo.
export function calcularCategoriaEtaria(
  fechaNacimiento: Date | null | undefined,
  sexo: SexoAnimal,
  especie: Especie,
  hoy: Date = new Date(),
): string | null {
  if (!fechaNacimiento) {
    return null;
  }

  const meses = mesesDeEdad(fechaNacimiento, hoy);
  const sufijo = especie === Especie.BUFALINO ? ' bufalino' : '';

  if (meses < MESES_TERNERO) {
    return (sexo === SexoAnimal.MACHO ? 'Ternero' : 'Ternera') + sufijo;
  }
  if (meses < MESES_NOVILLO) {
    return (sexo === SexoAnimal.MACHO ? 'Novillo' : 'Novilla') + sufijo;
  }
  return (sexo === SexoAnimal.MACHO ? 'Toro' : 'Vaca') + sufijo;
}
