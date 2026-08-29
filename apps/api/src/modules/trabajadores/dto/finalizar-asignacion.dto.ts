import { IsDateString, IsOptional } from 'class-validator';

export class FinalizarAsignacionDto {
  @IsOptional()
  @IsDateString()
  fechaFin?: string;
}
