import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CrearInsumoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  unidadMedida!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costoUnitario?: number;
}
