import { IsArray, IsDateString, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class CrearSuministroDto {
  @IsDateString()
  fecha!: string;

  @IsUUID()
  insumoId!: string;

  @IsOptional()
  @IsUUID()
  potreroId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  animalIds?: string[];

  @IsNumber()
  @Min(0.01)
  cantidad!: number;
}
