import { MotivoBaja } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class DarBajaDto {
  @IsEnum(MotivoBaja)
  motivo!: MotivoBaja;

  @IsDateString()
  fecha!: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
