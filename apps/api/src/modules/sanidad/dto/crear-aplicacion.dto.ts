import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CrearAplicacionDto {
  @IsUUID()
  animalId!: string;

  @IsUUID()
  productoId!: string;

  @IsDateString()
  fecha!: string;

  @IsOptional()
  @IsString()
  dosisAplicada?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
