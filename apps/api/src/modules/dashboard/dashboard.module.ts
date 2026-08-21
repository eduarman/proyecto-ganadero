import { Module } from '@nestjs/common';
import { PotrerosModule } from '../potreros/potreros.module';
import { ProduccionModule } from '../produccion/produccion.module';
import { ReproduccionModule } from '../reproduccion/reproduccion.module';
import { SanidadModule } from '../sanidad/sanidad.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [PotrerosModule, ProduccionModule, SanidadModule, ReproduccionModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
