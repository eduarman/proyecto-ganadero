import { Module } from '@nestjs/common';
import { AlimentacionModule } from '../alimentacion/alimentacion.module';
import { PotrerosModule } from '../potreros/potreros.module';
import { SanidadModule } from '../sanidad/sanidad.module';
import { ExportService } from './export.service';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { StorageService } from './storage.service';

@Module({
  imports: [AlimentacionModule, PotrerosModule, SanidadModule],
  controllers: [ReportesController],
  providers: [ReportesService, ExportService, StorageService],
})
export class ReportesModule {}
