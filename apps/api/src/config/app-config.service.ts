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
    return this.config.get<string>('SUPABASE_URL');
  }

  get supabaseServiceRoleKey(): string | undefined {
    return this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
  }

  get supabaseReportesBucket(): string {
    return this.config.get<string>('SUPABASE_REPORTES_BUCKET', 'reportes');
  }
}
