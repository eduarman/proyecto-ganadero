import { IsDateString, IsNumber, IsUUID, Min } from 'class-validator';

export class CrearRegistroPesoDto {
  @IsUUID()
  animalId!: string;

  @IsDateString()
  fecha!: string;

  @IsNumber()
  @Min(0)
  pesoKg!: number;
}
