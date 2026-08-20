import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CrearPotreroDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  nombre!: string;

  @IsNumber()
  @Min(0)
  areaHectareas!: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  tipoPasto?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  capacidadCarga?: number;
}
