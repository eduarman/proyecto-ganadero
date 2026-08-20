import { SexoAnimal, TipoParto } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CrearPartoDto {
  @IsUUID()
  madreId!: string;

  @IsDateString()
  fecha!: string;

  @IsEnum(TipoParto)
  tipo!: TipoParto;

  @IsOptional()
  @IsUUID()
  servicioId?: string;

  @IsOptional()
  @IsBoolean()
  mortinato?: boolean;

  @IsOptional()
  @IsString()
  observaciones?: string;

  // Si la cría nació viva y se quiere dar de alta directamente (US-4.1).
  @IsOptional()
  @IsString()
  @MaxLength(50)
  criaIdentificador?: string;

  @IsOptional()
  @IsEnum(SexoAnimal)
  criaSexo?: SexoAnimal;
}
