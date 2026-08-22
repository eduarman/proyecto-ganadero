import { ArrayMinSize, IsArray, IsDateString, IsUUID } from 'class-validator';

export class MoverAnimalesDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  animalIds!: string[];

  @IsUUID()
  potreroDestinoId!: string;

  @IsDateString()
  fecha!: string;
}
