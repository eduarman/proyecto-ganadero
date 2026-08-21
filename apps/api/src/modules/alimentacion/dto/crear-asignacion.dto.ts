import { IsArray, IsDateString, IsOptional, IsUUID } from 'class-validator';

export class CrearAsignacionDto {
  @IsOptional()
  @IsUUID()
  potreroId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  animalIds?: string[];

  @IsDateString()
  fechaInicio!: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;
}
