import { Especie } from '@prisma/client';

// Defaults documentados en design.md — sin configuración por negocio todavía
// (queda diferido, ver plan de la sesión).
export const DIAS_PARA_DIAGNOSTICO = 35;
export const GESTACION_DIAS: Record<Especie, number> = {
  [Especie.BOVINO]: 283,
  [Especie.BUFALINO]: 310,
};

function sumarDias(fecha: Date, dias: number): Date {
  return new Date(fecha.getTime() + dias * 24 * 60 * 60 * 1000);
}

export function calcularFechaEstimadaDiagnostico(fechaServicio: Date): Date {
  return sumarDias(fechaServicio, DIAS_PARA_DIAGNOSTICO);
}

export function calcularFechaProbableParto(fechaServicio: Date, especie: Especie): Date {
  return sumarDias(fechaServicio, GESTACION_DIAS[especie]);
}
