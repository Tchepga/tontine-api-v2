import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from 'src/member/entities/member.entity';
import { Tontine } from 'src/tontine/entities/tontine.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Event, Member, Tontine])],
  controllers: [EventController],
  providers: [EventService],
})
export class EventModule {}
