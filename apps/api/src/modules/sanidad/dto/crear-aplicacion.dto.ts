import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CrearAplicacionDto {
  @IsUUID()
  animalId!: string;

  @IsUUID()
  productoId!: string;

  @IsDateString()
  fecha!: string;

  @IsString()
  @IsNotEmpty()
  dosisAplicada!: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
