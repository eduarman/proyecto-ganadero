import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsNumber, IsUUID, Min, ValidateNested } from 'class-validator';

export class RegistroPesoLoteItemDto {
  @IsUUID()
  animalId!: string;

  @IsNumber()
  @Min(0)
  pesoKg!: number;
}

export class CrearRegistroPesoLoteDto {
  @IsDateString()
  fecha!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RegistroPesoLoteItemDto)
  registros!: RegistroPesoLoteItemDto[];
}
