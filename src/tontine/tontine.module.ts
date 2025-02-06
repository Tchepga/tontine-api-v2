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
import { RapportMeeting } from './entities/rapport-meeting.entity';
import { Sanction } from './entities/sanction.entity';
import { RateMap } from './entities/rate-map.entity';
import { MemberRole } from './entities/member-role.entity';
import { Notification } from 'src/notification/entities/notification.entity';
import { NotificationService } from 'src/notification/notification.service';
import { PartOrder } from './entities/part-order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tontine,
      Member,
      CashFlow,
      ConfigTontine,
      User,
      RapportMeeting,
      Sanction,
      RateMap,
      MemberRole,
      Notification,
      PartOrder,
    ]),
    MemberModule,
  ],
  controllers: [TontineController],
  providers: [TontineService, AuthentificationService, NotificationService],
  exports: [TontineService],
})
export class TontineModule { }
