import { RolUsuario } from '@prisma/client';
import { IsIn } from 'class-validator';
import { ROLES_INVITABLES } from './crear-invitacion.dto';

export class CambiarRolDto {
  @IsIn(ROLES_INVITABLES)
  rol!: RolUsuario;
}
