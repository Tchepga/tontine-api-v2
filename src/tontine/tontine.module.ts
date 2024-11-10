import { Module } from '@nestjs/common';
import { TontineService } from './tontine.service';
import { TontineController } from './tontine.controller';

@Module({
  controllers: [TontineController],
  providers: [TontineService],
})
export class TontineModule {}
