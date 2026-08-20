import { Especie, SexoAnimal } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CrearAnimalDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  identificador!: string;

  @IsEnum(Especie)
  especie!: Especie;

  @IsEnum(SexoAnimal)
  sexo!: SexoAnimal;

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
