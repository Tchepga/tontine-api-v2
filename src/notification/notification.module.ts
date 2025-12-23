import { Module } from '@nestjs/common';
import { AuthentificationService } from '../authentification/authentification.service';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { TontineService } from '../tontine/tontine.service';
import { MemberService } from '../member/member.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tontine } from '../tontine/entities/tontine.entity';
import { Member } from '../member/entities/member.entity';
import { Notification } from './entities/notification.entity';
import { User } from '../authentification/entities/user.entity';
import { Deposit } from '../tontine/entities/deposit.entity';
import { Loan } from '../loan/entities/loan.entity';
import { Sanction } from '../tontine/entities/sanction.entity';
import { Event } from '../event/entities/event.entity';
import { MissingDepositsReminderCron } from './reminders/missing-deposits-reminder.cron';
import { PushNotificationService } from './push-notification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      Tontine,
      Member,
      User,
      Event,
      Deposit,
      Loan,
      Sanction,
    ]),
  ],
  controllers: [NotificationController],
  providers: [
    TontineService,
    MemberService,
    AuthentificationService,
    NotificationService,
    NotificationGateway,
    WsJwtGuard,
    MissingDepositsReminderCron,
    PushNotificationService,
  ],
  exports: [NotificationService, NotificationGateway],
})
export class NotificationModule {}
