import { IsNotEmpty, MaxLength } from 'class-validator';

export class CrearCargoDto {
  @IsNotEmpty()
  @MaxLength(100)
  nombre!: string;
}
