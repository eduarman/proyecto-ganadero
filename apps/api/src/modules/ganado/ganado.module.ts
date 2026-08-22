import { Module } from '@nestjs/common';
import { GanadoImportacionService } from './ganado-importacion.service';
import { GanadoController } from './ganado.controller';
import { GanadoService } from './ganado.service';

@Module({
  controllers: [GanadoController],
  providers: [GanadoService, GanadoImportacionService],
  exports: [GanadoService],
})
export class GanadoModule {}
