import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthentificationModule } from 'src/authentification/authentification.module';
import { User } from 'src/authentification/entities/user.entity';
import { Member } from './entities/member.entity';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { Event } from 'src/event/entities/event.entity';
import { RapportMeeting } from 'src/tontine/entities/rapport-meeting.entity';
import { Deposit } from 'src/tontine/entities/deposit.entity';
import { TontineService } from 'src/tontine/tontine.service';
import { AuthentificationService } from 'src/authentification/authentification.service';
import { NotificationService } from 'src/notification/notification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Member, User, Event, RapportMeeting, Deposit]),
    AuthentificationModule,
  ],
  controllers: [MemberController],
  providers: [
    MemberService,
    TontineService,
    AuthentificationService,
    NotificationService,
  ],
  exports: [MemberService],
})
export class MemberModule {}
