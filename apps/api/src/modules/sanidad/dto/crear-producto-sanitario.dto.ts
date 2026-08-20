import { TipoProductoSanitario } from '@prisma/client';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min, MaxLength } from 'class-validator';

export class CrearProductoSanitarioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  nombre!: string;

  @IsEnum(TipoProductoSanitario)
  tipo!: TipoProductoSanitario;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  dosisRecomendada?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  intervaloRefuerzoDias?: number;
}
