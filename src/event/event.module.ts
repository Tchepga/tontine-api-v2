import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from 'src/member/entities/member.entity';
import { Tontine } from 'src/tontine/entities/tontine.entity';
import { TontineService } from 'src/tontine/tontine.service';
import { MemberService } from 'src/member/member.service';
import { AuthentificationService } from 'src/authentification/authentification.service';
import { NotificationService } from 'src/notification/notification.service';

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
