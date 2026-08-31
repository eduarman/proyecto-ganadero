import { MonedaTrabajador } from '@prisma/client';
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CrearAdelantoDto {
  @IsDateString()
  fecha!: string;

  @IsNumber()
  @Min(0.01)
  monto!: number;

  @IsEnum(MonedaTrabajador)
  moneda!: MonedaTrabajador;

  @IsOptional()
  @IsNumber()
  @Min(0.0001)
  tasaCambio?: number;

  @IsNotEmpty()
  @IsString()
  motivo!: string;

  @IsOptional()
  @IsString()
  metodoEntrega?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
