import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CrearCuarentenaDto {
  @IsUUID()
  animalId!: string;

  @IsDateString()
  fechaInicio!: string;

  @IsOptional()
  @IsDateString()
  fechaFinEstimada?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  motivo!: string;
}
