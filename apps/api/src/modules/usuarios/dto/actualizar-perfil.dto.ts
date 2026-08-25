import { IsNotEmpty, MaxLength } from 'class-validator';

export class ActualizarPerfilDto {
  @IsNotEmpty()
  @MaxLength(150)
  nombre!: string;
}
