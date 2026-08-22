import { Especie, EstadoProtocoloSanitario, SexoAnimal } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class ActualizarProtocoloDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  nombre?: string;

  @IsOptional()
  @IsUUID()
  productoId?: string;

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

  @IsOptional()
  @IsEnum(EstadoProtocoloSanitario)
  estado?: EstadoProtocoloSanitario;
}
