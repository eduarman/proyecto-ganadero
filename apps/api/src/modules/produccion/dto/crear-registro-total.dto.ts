import { TurnoOrdenio } from '@prisma/client';
import { IsDateString, IsEnum, IsNumber, Min } from 'class-validator';

export class CrearRegistroTotalDto {
  @IsDateString()
  fecha!: string;

  @IsEnum(TurnoOrdenio)
  turno!: TurnoOrdenio;

  @IsNumber()
  @Min(0)
  litrosTotal!: number;
}
