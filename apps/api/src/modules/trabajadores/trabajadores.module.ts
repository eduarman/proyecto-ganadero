import { Module } from '@nestjs/common';
import { ExportService } from '../reportes/export.service';
import { TrabajadoresController } from './trabajadores.controller';
import { TrabajadoresService } from './trabajadores.service';

@Module({
  controllers: [TrabajadoresController],
  providers: [TrabajadoresService, ExportService],
})
export class TrabajadoresModule {}
