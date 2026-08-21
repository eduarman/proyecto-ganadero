interface PotreroOcupacion {
  estado: string;
  capacidadCarga: unknown;
  ocupacionActual: number;
}

export interface ClasificacionOcupacion {
  normal: number;
  cercaLimite: number;
  sobrecargado: number;
}

const UMBRAL_CERCA_LIMITE = 0.8;

export function clasificarOcupacion(potreros: PotreroOcupacion[]): ClasificacionOcupacion {
  let normal = 0;
  let cercaLimite = 0;
  let sobrecargado = 0;

  for (const p of potreros) {
    if (p.estado !== 'ACTIVO' || !p.capacidadCarga) continue;
    const capacidad = Number(p.capacidadCarga);
    const ratio = capacidad > 0 ? p.ocupacionActual / capacidad : 0;
    if (ratio > 1) sobrecargado += 1;
    else if (ratio >= UMBRAL_CERCA_LIMITE) cercaLimite += 1;
    else normal += 1;
  }

  return { normal, cercaLimite, sobrecargado };
}
