import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event } from './entities/event.entity';
import { DataSource } from 'typeorm';
import { Member } from 'src/member/entities/member.entity';
import { Tontine } from 'src/tontine/entities/tontine.entity';
import { User } from 'src/authentification/entities/user.entity';
import { NotificationService } from 'src/notification/notification.service';
import { Action } from 'src/notification/utility/message-notification';
import { TypeNotification } from 'src/notification/enum/type-notification';

@Injectable()
export class EventService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly notificationService: NotificationService
  ) { }

  async create(createEventDto: CreateEventDto, user: User) {
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

    const author = await this.dataSource
      .getRepository(Member)
      .findOne({ where: { user: { username: user.username } } });
    if (!author) {
      throw new BadRequestException('Author not found');
    }

    const event = new Event();
    event.author = author;
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

    const eventSaved = await this.dataSource.getRepository(Event).save(event);

    this.notificationService.create({
      action: Action.CREATE,
      tontineId,
      eventId: eventSaved.id,
      type: TypeNotification.EVENT
    },
      user
    );

    return eventSaved;
  }

  async findAll(tontineId: number) {
    const tontine = await this.dataSource
      .getRepository(Tontine)
      .findOne({ where: { id: tontineId } });
    if (!tontine) {
      throw new BadRequestException('Tontine not found');
    }
    return this.dataSource.getRepository(Event).find({
      where: { tontine: { id: tontineId } },
      relations: ['author', 'author.user', 'participants'],
    });
  }

  findOne(id: number) {
    return this.dataSource.getRepository(Event).findOne({
      where: { id },
      relations: ['author', 'author.user', 'participants'],
    });
  }

  async update(id: number, updateEventDto: UpdateEventDto, user: User) {
    const event = await this.findOne(id);
    if (!event) {
      throw new BadRequestException('Event not found');
    }

    const isOwnerOfEvent = event.author.user.username == user.username;
    if (!isOwnerOfEvent) {
      throw new BadRequestException('You are not the owner of this event');
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

  async remove(id: number, user: User) {
    const event = await this.findOne(id);
    if (!event) {
      throw new BadRequestException('Event not found');
    }
    const isOwnerOfEvent = event.author.user.username == user.username;
    if (!isOwnerOfEvent) {
      throw new BadRequestException('You are not the owner of this event');
    }
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
