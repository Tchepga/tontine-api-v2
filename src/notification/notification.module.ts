import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthentificationService } from 'src/authentification/authentification.service';
import { User } from 'src/authentification/entities/user.entity';
import { Event } from 'src/event/entities/event.entity';
import { Loan } from 'src/loan/entities/loan.entity';
import { MailModule } from 'src/mail/mail.module';
import { Member } from 'src/member/entities/member.entity';
import { MemberService } from 'src/member/member.service';
import { Deposit } from 'src/tontine/entities/deposit.entity';
import { Sanction } from 'src/tontine/entities/sanction.entity';
import { Tontine } from 'src/tontine/entities/tontine.entity';
import { TontineService } from 'src/tontine/tontine.service';
import { Notification } from './entities/notification.entity';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';

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
    MailModule,
  ],
  controllers: [NotificationController],
  providers: [
    TontineService,
    MemberService,
    AuthentificationService,
    NotificationService,
    NotificationGateway,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
