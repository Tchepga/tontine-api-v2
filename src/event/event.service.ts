import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event } from './entities/event.entity';
import { DataSource } from 'typeorm';
import { Member } from 'src/member/entities/member.entity';
import { Tontine } from 'src/tontine/entities/tontine.entity';

@Injectable()
export class EventService {
  constructor(private readonly dataSource: DataSource) {}
  async create(createEventDto: CreateEventDto) {
    const {
      tontineId,
      title,
      type,
      description,
      startDate,
      endDate,
      participants,
    } = createEventDto;
    const tontine = await this.dataSource
      .getRepository(Tontine)
      .findOne({ where: { id: tontineId } });
    if (!tontine) {
      throw new BadRequestException('Tontine not found');
    }

    const event = new Event();
    event.title = title;
    event.type = type;
    event.description = description;
    event.startDate = startDate;
    if (endDate) {
      event.endDate = endDate;
    }
    if (participants) {
      participants.forEach(async (id) => {
        const member = await this.dataSource
          .getRepository(Member)
          .findOne({ where: { id } });

        if (member) {
          event.participants.push(member);
        }
      });
    }
    event.tontine = tontine;

    return this.dataSource.getRepository(Event).save(event);
  }

  findAll() {
    return `This action returns all event`;
  }

  findOne(id: number) {
    return `This action returns a #${id} event`;
  }

  update(id: number, updateEventDto: UpdateEventDto) {
    return `This action updates a #${id} event`;
  }

  remove(id: number) {
    return `This action removes a #${id} event`;
  }
}
