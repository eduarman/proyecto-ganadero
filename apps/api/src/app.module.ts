import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppConfigModule } from './config/app-config.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { GanadoModule } from './modules/ganado/ganado.module';
import { PotrerosModule } from './modules/potreros/potreros.module';
import { SanidadModule } from './modules/sanidad/sanidad.module';
import { ProduccionModule } from './modules/produccion/produccion.module';
import { ReproduccionModule } from './modules/reproduccion/reproduccion.module';
import { AlimentacionModule } from './modules/alimentacion/alimentacion.module';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 60 }],
    }),
    AuthModule,
    GanadoModule,
    PotrerosModule,
    SanidadModule,
    ProduccionModule,
    ReproduccionModule,
    AlimentacionModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
