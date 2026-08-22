import { ArrayMinSize, IsArray, IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CrearAplicacionLoteDto {
  @IsUUID()
  productoId!: string;

  @IsDateString()
  fecha!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  animalIds!: string[];

  @IsOptional()
  @IsString()
  dosisAplicada?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
