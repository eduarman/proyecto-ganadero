import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from '../../modules/auth/jwt-payload.interface';

// Exige que el access token tenga un tenantId resuelto (negocio activo).
// Debe usarse después de JwtAuthGuard en la cadena de guards.
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user: JwtPayload }>();
    if (!request.user?.tenantId) {
      throw new ForbiddenException('No tenés un negocio activo seleccionado.');
    }
    return true;
  }
}
