import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthentificationModule } from 'src/authentification/authentification.module';
import { User } from 'src/authentification/entities/user.entity';
import { Member } from './entities/member.entity';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { Event } from 'src/event/entities/event.entity';
import { RapportMeeting } from 'src/tontine/entities/rapport-meeting.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Member, User, Event, RapportMeeting]),
    AuthentificationModule,
  ],
  controllers: [MemberController],
  providers: [MemberService],
  exports: [MemberService],
})
export class MemberModule {}
