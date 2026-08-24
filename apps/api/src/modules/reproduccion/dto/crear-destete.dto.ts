import { IsDateString, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class CrearDesteteDto {
  @IsUUID()
  animalId!: string;

  @IsDateString()
  fecha!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pesoDestete?: number;
}
