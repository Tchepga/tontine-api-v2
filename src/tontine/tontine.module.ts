import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from '../member/entities/member.entity';
import { CashFlow } from './entities/cashflow.entity';
import { ConfigTontine } from './entities/config-tontine.entity';
import { Tontine } from './entities/tontine.entity';
import { TontineController } from './tontine.controller';
import { InvitationController } from './invitation.controller';
import { TontineService } from './tontine.service';
import { MemberModule } from '../member/member.module';
import { AuthentificationService } from '../authentification/authentification.service';
import { User } from '../authentification/entities/user.entity';
import { RapportMeeting } from './entities/rapport-meeting.entity';
import { Sanction } from './entities/sanction.entity';
import { RateMap } from './entities/rate-map.entity';
import { MemberRole } from './entities/member-role.entity';
import { Notification } from '../notification/entities/notification.entity';
import { NotificationModule } from '../notification/notification.module';
import { PartOrder } from './entities/part-order.entity';
import { InvitationLink } from './entities/invitation-link.entity';

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
      InvitationLink,
    ]),
    MemberModule,
    NotificationModule,
  ],
  controllers: [TontineController, InvitationController],
  providers: [TontineService, AuthentificationService],
  exports: [TontineService],
})
export class TontineModule {}
