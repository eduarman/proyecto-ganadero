import { RolUsuario } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  tenantId: string | null;
  rol: RolUsuario | null;
  readonly: boolean;
}
