import { RolUsuario } from '@prisma/client';
import { IsEmail, IsIn } from 'class-validator';

// El rol asignable en una invitación nunca incluye ADMIN_NEGOCIO: ese rol es
// exclusivo del creador del negocio en v1 (requirements.md US-2.4).
export const ROLES_INVITABLES = [
  RolUsuario.MAYORDOMO,
  RolUsuario.OPERARIO,
  RolUsuario.VETERINARIO_EXTERNO,
] as const;

export class CrearInvitacionDto {
  @IsEmail()
  email!: string;

  @IsIn(ROLES_INVITABLES)
  rol!: RolUsuario;
}
