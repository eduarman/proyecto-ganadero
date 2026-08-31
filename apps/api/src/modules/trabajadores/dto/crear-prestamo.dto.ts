import { MonedaTrabajador } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CrearPrestamoDto {
  @IsDateString()
  fecha!: string;

  @IsNumber()
  @Min(0.01)
  montoOriginal!: number;

  @IsEnum(MonedaTrabajador)
  moneda!: MonedaTrabajador;

  @IsOptional()
  @IsNumber()
  @Min(0.0001)
  tasaCambio?: number;

  @IsInt()
  @Min(1)
  numeroCuotas!: number;

  @IsNumber()
  @Min(0.01)
  valorCuota!: number;

  @IsDateString()
  fechaInicio!: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
