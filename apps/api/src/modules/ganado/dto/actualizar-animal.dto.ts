import { Especie, SexoAnimal } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class ActualizarAnimalDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  identificador?: string;

  @IsOptional()
  @IsEnum(Especie)
  especie?: Especie;

  @IsOptional()
  @IsEnum(SexoAnimal)
  sexo?: SexoAnimal;

  @IsOptional()
  @IsDateString()
  fechaNacimiento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  categoria?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  raza?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  color?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pesoNacimiento?: number;

  @IsOptional()
  @IsUUID()
  madreId?: string;

  @IsOptional()
  @IsUUID()
  padreId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  madreRefExterna?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  padreRefExterna?: string;

  @IsOptional()
  @IsString()
  fotoUrl?: string;

  @IsOptional()
  @IsUUID()
  potreroActualId?: string;
}
