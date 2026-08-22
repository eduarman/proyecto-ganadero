import { Especie, SexoAnimal } from '@prisma/client';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CrearProtocoloDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  nombre!: string;

  @IsUUID()
  productoId!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  edadInicioDias?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  frecuenciaDias?: number;

  @IsOptional()
  @IsEnum(Especie)
  especie?: Especie;

  @IsOptional()
  @IsEnum(SexoAnimal)
  sexo?: SexoAnimal;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  categoria?: string;
}
