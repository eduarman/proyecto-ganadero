import { GravedadDiagnostico } from '@prisma/client';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CrearDiagnosticoDto {
  @IsUUID()
  animalId!: string;

  @IsDateString()
  fecha!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  condicion!: string;

  @IsEnum(GravedadDiagnostico)
  gravedad!: GravedadDiagnostico;

  @IsOptional()
  @IsUUID()
  tratamientoAplicacionId?: string;
}
