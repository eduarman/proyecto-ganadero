import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppConfigModule } from '../../config/app-config.module';
import { AppConfigService } from '../../config/app-config.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConsoleEmailSender, EmailSender } from './services/email-sender';
import { PasswordService } from './services/password.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { ResendEmailSender } from './services/resend-email-sender';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    AppConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        secret: config.jwtAccessSecret,
        // El formato ("15m", "7d") se valida en env.ts; el tipo de @nestjs/jwt
        // exige un literal de plantilla que TS no puede inferir de un string de env.
        signOptions: { expiresIn: config.jwtAccessExpiresIn as any },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    RefreshTokenService,
    JwtStrategy,
    {
      provide: EmailSender,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) =>
        config.resendApiKey && config.emailFrom ? new ResendEmailSender(config) : new ConsoleEmailSender(),
    },
  ],
})
export class AuthModule {}
