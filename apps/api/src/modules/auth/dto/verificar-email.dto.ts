import { IsNotEmpty } from 'class-validator';

export class VerificarEmailDto {
  @IsNotEmpty()
  token!: string;
}
