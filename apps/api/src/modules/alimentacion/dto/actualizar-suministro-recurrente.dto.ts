import { IsBoolean, IsDateString, IsNumber, IsOptional, Min } from 'class-validator';

export class ActualizarSuministroRecurrenteDto {
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  cantidad?: number;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
