import { TipoPago } from '@prisma/client';
import { IsDateString, IsEnum } from 'class-validator';

export class PrevisualizarPagoDto {
  @IsEnum(TipoPago)
  tipo!: TipoPago;

  @IsDateString()
  periodoDesde!: string;

  @IsDateString()
  periodoHasta!: string;
}
