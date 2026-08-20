import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class ActualizarPotreroDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  nombre?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  areaHectareas?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  tipoPasto?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  capacidadCarga?: number;
}
