import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { Member } from '../member/entities/member.entity';
import { Tontine } from '../tontine/entities/tontine.entity';
import { TontineService } from '../tontine/tontine.service';
import { MemberService } from '../member/member.service';
import { AuthentificationService } from '../authentification/authentification.service';
import { NotificationService } from '../notification/notification.service';

@Module({
  imports: [TypeOrmModule.forFeature([Event, Member, Tontine])],
  controllers: [EventController],
  providers: [
    EventService,
    TontineService,
    MemberService,
    AuthentificationService,
    NotificationService,
  ],
})
export class EventModule {}
