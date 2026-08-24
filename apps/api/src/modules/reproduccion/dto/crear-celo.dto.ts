import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CrearCeloDto {
  @IsUUID()
  animalId!: string;

  @IsDateString()
  fecha!: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
