import { TipoServicio } from '@prisma/client';
import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CrearServicioDto {
  @IsUUID()
  animalId!: string;

  @IsEnum(TipoServicio)
  tipo!: TipoServicio;

  @IsDateString()
  fecha!: string;

  @IsOptional()
  @IsUUID()
  machoId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  semenReferencia?: string;

  // Permite insistir con un nuevo servicio aunque ya haya uno activo sin
  // cerrar (US-2.3: el sistema advierte, no bloquea).
  @IsOptional()
  @IsBoolean()
  confirmarDuplicado?: boolean;
}
