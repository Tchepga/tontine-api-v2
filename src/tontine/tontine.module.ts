import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from 'src/member/entities/member.entity';
import { CashFlow } from './entities/cashflow.entity';
import { ConfigTontine } from './entities/config-tontine.entity';
import { Tontine } from './entities/tontine.entity';
import { TontineController } from './tontine.controller';
import { TontineService } from './tontine.service';
import { MemberModule } from 'src/member/member.module';
import { AuthentificationService } from 'src/authentification/authentification.service';
import { User } from 'src/authentification/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tontine, Member, CashFlow, ConfigTontine, User]),
    MemberModule,
  ],
  controllers: [TontineController],
  providers: [TontineService, AuthentificationService],
})
export class TontineModule {}
