import { Module } from '@nestjs/common';
import { PotrerosController } from './potreros.controller';
import { PotrerosService } from './potreros.service';

@Module({
  controllers: [PotrerosController],
  providers: [PotrerosService],
  exports: [PotrerosService],
})
export class PotrerosModule {}
