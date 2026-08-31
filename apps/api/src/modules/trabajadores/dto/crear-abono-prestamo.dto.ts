import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CrearAbonoPrestamoDto {
  @IsDateString()
  fecha!: string;

  @IsNumber()
  @Min(0.01)
  monto!: number;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
