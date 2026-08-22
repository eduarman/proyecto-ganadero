import { Module } from '@nestjs/common';
import { PotrerosModule } from '../potreros/potreros.module';
import { GanadoImportacionService } from './ganado-importacion.service';
import { GanadoController } from './ganado.controller';
import { GanadoService } from './ganado.service';

@Module({
  imports: [PotrerosModule],
  controllers: [GanadoController],
  providers: [GanadoService, GanadoImportacionService],
  exports: [GanadoService],
})
export class GanadoModule {}
