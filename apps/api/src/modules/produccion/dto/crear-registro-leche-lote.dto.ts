import { TurnoOrdenio } from '@prisma/client';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsEnum, IsNumber, IsUUID, Min, ValidateNested } from 'class-validator';

export class RegistroLecheLoteItemDto {
  @IsUUID()
  animalId!: string;

  @IsNumber()
  @Min(0)
  litros!: number;
}

export class CrearRegistroLecheLoteDto {
  @IsDateString()
  fecha!: string;

  @IsEnum(TurnoOrdenio)
  turno!: TurnoOrdenio;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RegistroLecheLoteItemDto)
  registros!: RegistroLecheLoteItemDto[];
}
