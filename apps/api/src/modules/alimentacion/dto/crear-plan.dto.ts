import { DestinoPlanItem, TipoPlanAlimentacion, UnidadTiempoPlan } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class PlanItemDto {
  @IsUUID()
  insumoId!: string;

  @IsNumber()
  @Min(0.01)
  cantidad!: number;

  @IsEnum(UnidadTiempoPlan)
  unidadTiempo!: UnidadTiempoPlan;

  @IsEnum(DestinoPlanItem)
  por!: DestinoPlanItem;
}

export class CrearPlanDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  nombre!: string;

  @IsEnum(TipoPlanAlimentacion)
  tipo!: TipoPlanAlimentacion;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PlanItemDto)
  items!: PlanItemDto[];
}
