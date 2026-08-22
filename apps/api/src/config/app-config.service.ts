import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService) {}

  get jwtAccessSecret(): string {
    return this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
  }

  get jwtAccessExpiresIn(): string {
    return this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m');
  }

  get refreshTokenExpiresInDays(): number {
    return Number(this.config.get<string>('REFRESH_TOKEN_EXPIRES_IN_DAYS', '7'));
  }

  get port(): number {
    return Number(this.config.get<string>('PORT', '3000'));
  }

  get corsOrigin(): string {
    return this.config.get<string>('CORS_ORIGIN', 'http://localhost:5173');
  }

  get supabaseUrl(): string | undefined {
    // DEBUG TEMPORAL: renombrado de SUPABASE_URL para descartar que Railway
    // reserve/maneje especial ese prefijo. Revertir apenas se confirme la causa.
    return this.config.get<string>('SB_STORAGE_URL') ?? this.config.get<string>('SUPABASE_URL');
  }

  get supabaseServiceRoleKey(): string | undefined {
    return this.config.get<string>('SB_STORAGE_KEY') ?? this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
  }

  get supabaseReportesBucket(): string {
    return this.config.get<string>('SB_STORAGE_BUCKET') ?? this.config.get<string>('SUPABASE_REPORTES_BUCKET', 'reportes');
  }
}
