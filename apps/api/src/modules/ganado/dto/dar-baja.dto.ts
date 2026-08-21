import { MotivoBaja } from '@prisma/client';
import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class DarBajaDto {
  @IsEnum(MotivoBaja)
  motivo!: MotivoBaja;

  @IsDateString()
  fecha!: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  // Permite confirmar la baja igual, aunque el animal tenga eventos
  // reproductivos pendientes (US-4.3: el sistema advierte, no bloquea).
  @IsOptional()
  @IsBoolean()
  confirmarConEventosPendientes?: boolean;
}
