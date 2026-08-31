import { MonedaTrabajador, TipoPago } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class DescuentoAdelantoDto {
  @IsUUID()
  adelantoId!: string;

  @IsNumber()
  @Min(0.01)
  monto!: number;
}

export class DescuentoPrestamoDto {
  @IsUUID()
  prestamoId!: string;

  @IsNumber()
  @Min(0.01)
  monto!: number;
}

export class ConfirmarPagoDto {
  @IsEnum(TipoPago)
  tipo!: TipoPago;

  @IsDateString()
  periodoDesde!: string;

  @IsDateString()
  periodoHasta!: string;

  @IsNumber()
  @Min(0)
  montoBase!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bonificaciones?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  otrosDescuentos?: number;

  @IsEnum(MonedaTrabajador)
  moneda!: MonedaTrabajador;

  @IsOptional()
  @IsNumber()
  @Min(0.0001)
  tasaCambio?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DescuentoAdelantoDto)
  adelantos?: DescuentoAdelantoDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DescuentoPrestamoDto)
  prestamos?: DescuentoPrestamoDto[];

  @IsDateString()
  fecha!: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsBoolean()
  confirmar?: boolean;
}
