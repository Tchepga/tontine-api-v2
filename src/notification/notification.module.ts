import { Module } from '@nestjs/common';
import { AuthentificationService } from 'src/authentification/authentification.service';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { TontineService } from 'src/tontine/tontine.service';
import { MemberService } from 'src/member/member.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tontine } from 'src/tontine/entities/tontine.entity';
import { Member } from 'src/member/entities/member.entity';
import { Notification } from './entities/notification.entity';
import { User } from 'src/authentification/entities/user.entity';
import { Deposit } from 'src/tontine/entities/deposit.entity';
import { Loan } from 'src/loan/entities/loan.entity';
import { Sanction } from 'src/tontine/entities/sanction.entity';
import { Event } from 'src/event/entities/event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    Notification,
    Tontine,
    Member,
    User,
    Event,
    Deposit,
    Loan,
    Sanction,
  ])],
  controllers: [NotificationController],
  providers: [
    TontineService,
    MemberService,
    AuthentificationService,
    NotificationService,
  ],
  exports: [NotificationService],
})
export class NotificationModule { }
