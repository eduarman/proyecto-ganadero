import { TurnoOrdenio } from '@prisma/client';
import { IsDateString, IsEnum, IsNumber, IsUUID, Min } from 'class-validator';

export class CrearRegistroLecheDto {
  @IsUUID()
  animalId!: string;

  @IsDateString()
  fecha!: string;

  @IsEnum(TurnoOrdenio)
  turno!: TurnoOrdenio;

  @IsNumber()
  @Min(0)
  litros!: number;
}
