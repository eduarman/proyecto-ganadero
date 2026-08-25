import { IsNotEmpty, Matches, MinLength } from 'class-validator';

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).+$/;

export class CambiarPasswordDto {
  @IsNotEmpty()
  passwordActual!: string;

  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(PASSWORD_REGEX, {
    message: 'La contraseña debe incluir al menos una mayúscula y un número',
  })
  passwordNueva!: string;
}
