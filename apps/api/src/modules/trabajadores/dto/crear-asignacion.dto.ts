import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CrearAsignacionDto {
  @IsOptional()
  @IsUUID()
  cargoId?: string;

  @IsOptional()
  @IsUUID()
  potreroId?: string;

  @IsDateString()
  fechaInicio!: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
