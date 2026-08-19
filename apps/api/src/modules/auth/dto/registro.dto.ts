import { IsEmail, IsNotEmpty, Matches, MaxLength, MinLength } from 'class-validator';

// Mínimo 8 caracteres, al menos una mayúscula y un número (requirements.md US-4.2).
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).+$/;

export class RegistroDto {
  @IsEmail()
  email!: string;

  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(PASSWORD_REGEX, {
    message: 'La contraseña debe incluir al menos una mayúscula y un número',
  })
  password!: string;

  @IsNotEmpty()
  @MaxLength(150)
  nombre!: string;
}
