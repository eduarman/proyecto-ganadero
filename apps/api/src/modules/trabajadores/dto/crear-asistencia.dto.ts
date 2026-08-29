import { EstadoAsistencia } from '@prisma/client';
import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator';

const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CrearAsistenciaDto {
  @IsDateString()
  fecha!: string;

  @IsEnum(EstadoAsistencia)
  estado!: EstadoAsistencia;

  @IsOptional()
  @Matches(HORA_REGEX, { message: 'La hora debe tener formato HH:mm' })
  horaEntrada?: string;

  @IsOptional()
  @Matches(HORA_REGEX, { message: 'La hora debe tener formato HH:mm' })
  horaSalida?: string;

  @IsOptional()
  @IsString()
  tipoJornada?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  jornalRealizado?: number;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsBoolean()
  confirmar?: boolean;
}
