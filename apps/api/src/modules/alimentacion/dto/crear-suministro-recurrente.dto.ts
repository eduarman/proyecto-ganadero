import { FrecuenciaSuministro } from '@prisma/client';
import { ArrayMinSize, IsArray, IsDateString, IsEnum, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class CrearSuministroRecurrenteDto {
  @IsUUID()
  insumoId!: string;

  @IsOptional()
  @IsUUID()
  potreroId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  animalIds?: string[];

  @IsNumber()
  @Min(0.01)
  cantidad!: number;

  @IsEnum(FrecuenciaSuministro)
  frecuencia!: FrecuenciaSuministro;

  @IsDateString()
  fechaInicio!: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;
}
