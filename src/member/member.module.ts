import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthentificationModule } from '../authentification/authentification.module';
import { User } from '../authentification/entities/user.entity';
import { Member } from './entities/member.entity';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { Event } from '../event/entities/event.entity';
import { RapportMeeting } from '../tontine/entities/rapport-meeting.entity';
import { Deposit } from '../tontine/entities/deposit.entity';
import { TontineService } from '../tontine/tontine.service';
import { AuthentificationService } from '../authentification/authentification.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Member, User, Event, RapportMeeting, Deposit]),
    forwardRef(() => AuthentificationModule),
    NotificationModule,
  ],
  controllers: [MemberController],
  providers: [MemberService, TontineService, AuthentificationService],
  exports: [MemberService],
})
export class MemberModule {}
