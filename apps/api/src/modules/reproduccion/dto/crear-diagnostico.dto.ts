import { MetodoDiagnostico, ResultadoDiagnostico } from '@prisma/client';
import { IsDateString, IsEnum, IsUUID } from 'class-validator';

export class CrearDiagnosticoDto {
  @IsUUID()
  servicioId!: string;

  @IsEnum(ResultadoDiagnostico)
  resultado!: ResultadoDiagnostico;

  @IsEnum(MetodoDiagnostico)
  metodo!: MetodoDiagnostico;

  @IsDateString()
  fecha!: string;
}
