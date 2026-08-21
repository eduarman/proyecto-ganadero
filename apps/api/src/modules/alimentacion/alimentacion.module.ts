import { Module } from '@nestjs/common';
import { AlimentacionController } from './alimentacion.controller';
import { AlimentacionService } from './alimentacion.service';

@Module({
  controllers: [AlimentacionController],
  providers: [AlimentacionService],
})
export class AlimentacionModule {}
