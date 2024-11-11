import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from 'src/member/entities/member.entity';
import { CashFlow } from './entities/cashflow.entity';
import { ConfigTontine } from './entities/config-tontine.entity';
import { Tontine } from './entities/tontine.entity';
import { TontineController } from './tontine.controller';
import { TontineService } from './tontine.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tontine, Member, CashFlow, ConfigTontine]),
  ],
  controllers: [TontineController],
  providers: [TontineService],
})
export class TontineModule {}
