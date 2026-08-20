import { Module } from '@nestjs/common';
import { GanadoController } from './ganado.controller';
import { GanadoService } from './ganado.service';

@Module({
  controllers: [GanadoController],
  providers: [GanadoService],
})
export class GanadoModule {}
