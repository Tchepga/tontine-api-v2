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

  async findAll(tontineId: number) {
    const tontine = await this.dataSource
      .getRepository(Tontine)
      .findOne({ where: { id: tontineId } });
    if (!tontine) {
      throw new BadRequestException('Tontine not found');
    }
    return this.dataSource.getRepository(Event).find({ where: { tontine } });
  }

  findOne(id: number) {
    return this.dataSource.getRepository(Event).findOne({ where: { id } });
  }

  async update(id: number, updateEventDto: UpdateEventDto) {
    const event = await this.findOne(id);
    if (!event) {
      throw new BadRequestException('Event not found');
    }

    const { title, type, description, startDate, endDate } = updateEventDto;
    if (!title && !type && !description && !startDate && !endDate) {
      throw new BadRequestException('No data provided');
    }

    if (title) {
      event.title = title;
    }
    if (type) {
      event.type = type;
    }
    if (description) {
      event.description = description;
    }
    if (startDate) {
      event.startDate = startDate;
    }
    if (endDate) {
      event.endDate = endDate;
    }

    return this.dataSource.getRepository(Event).save(event);
  }

  remove(id: number) {
    return this.dataSource.getRepository(Event).delete(id);
  }

  async addParticipant(eventId: number, memberId: number) {
    const event = await this.findOne(eventId);
    if (!event) {
      throw new BadRequestException('Event not found');
    }

    const member = await this.dataSource
      .getRepository(Member)
      .findOne({ where: { id: memberId } });
    if (!member) {
      throw new BadRequestException('Member not found');
    }

    event.participants.push(member);
    return this.dataSource.getRepository(Event).save(event);
  }

  async removeParticipant(eventId: number, memberId: number) {
    const event = await this.findOne(eventId);
    if (!event) {
      throw new BadRequestException('Event not found');
    }

    const member = await this.dataSource
      .getRepository(Member)
      .findOne({ where: { id: memberId } });
    if (!member) {
      throw new BadRequestException('Member not found');
    }

    event.participants = event.participants.filter((p) => p.id !== memberId);
    return this.dataSource.getRepository(Event).save(event);
  }
}
