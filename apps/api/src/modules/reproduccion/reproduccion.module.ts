import { Module } from '@nestjs/common';
import { GanadoModule } from '../ganado/ganado.module';
import { ReproduccionController } from './reproduccion.controller';
import { ReproduccionService } from './reproduccion.service';

@Module({
  imports: [GanadoModule],
  controllers: [ReproduccionController],
  providers: [ReproduccionService],
})
export class ReproduccionModule {}
