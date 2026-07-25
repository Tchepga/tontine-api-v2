import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthentificationService } from 'src/authentification/authentification.service';
import { MailModule } from 'src/mail/mail.module';
import { Member } from 'src/member/entities/member.entity';
import { MemberService } from 'src/member/member.service';
import { NotificationService } from 'src/notification/notification.service';
import { Tontine } from 'src/tontine/entities/tontine.entity';
import { TontineService } from 'src/tontine/tontine.service';
import { Event } from './entities/event.entity';
import { EventController } from './event.controller';
import { EventService } from './event.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, Member, Tontine]),
    MailModule,
  ],
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
