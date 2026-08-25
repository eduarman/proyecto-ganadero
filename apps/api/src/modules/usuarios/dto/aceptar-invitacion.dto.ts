import { IsOptional, MaxLength, Matches, MinLength } from 'class-validator';

// Mínimo 8 caracteres, al menos una mayúscula y un número — misma regla que
// registro.dto.ts. Ambos campos son opcionales a nivel DTO porque solo se
// exigen cuando el email invitado todavía no es un usuario de la plataforma;
// esa validación depende de datos y se hace a mano en el service.
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).+$/;

export class AceptarInvitacionDto {
  @IsOptional()
  @MaxLength(150)
  nombre?: string;

  @IsOptional()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(PASSWORD_REGEX, {
    message: 'La contraseña debe incluir al menos una mayúscula y un número',
  })
  password?: string;
}
