import { EstadoAnimal, SexoAnimal } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class ListarAnimalesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit: number = 20;

  @IsOptional()
  @IsEnum(EstadoAnimal)
  estado?: EstadoAnimal;

  @IsOptional()
  @IsEnum(SexoAnimal)
  sexo?: SexoAnimal;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  potreroActualId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  edadMinMeses?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  edadMaxMeses?: number;
}
