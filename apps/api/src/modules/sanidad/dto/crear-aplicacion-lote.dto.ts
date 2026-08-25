import { ArrayMinSize, IsArray, IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CrearAplicacionLoteDto {
  @IsUUID()
  productoId!: string;

  @IsDateString()
  fecha!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  animalIds!: string[];

  @IsString()
  @IsNotEmpty()
  dosisAplicada!: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
