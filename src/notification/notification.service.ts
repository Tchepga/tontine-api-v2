import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Notification } from './entities/notification.entity';
import { TypeNotification } from './enum/type-notification';
import {
  messageNotification
} from './utility/message-notification';
import { Tontine } from 'src/tontine/entities/tontine.entity';
import { User } from 'src/authentification/entities/user.entity';
import { Member } from 'src/member/entities/member.entity';

@Injectable()
export class NotificationService {
  private readonly COUNT_NOTIFICATIONS = 10;

  constructor(private readonly dataSource: DataSource) { }

  async create(data: CreateNotificationDto, user: User) {

    const tontine = await this.dataSource.getRepository(Tontine).findOne({ where: { id: data.tontineId } });
    if (!tontine) {
      throw new BadRequestException('Tontine not found');
    }

    const member = await this.dataSource.getRepository(Member).findOne({ where: { user: { username: user.username } } });
    if (!member) {
      throw new BadRequestException('Member not found');
    }
    if (!tontine.members.some(m => m.id === member.id)) {
      throw new BadRequestException('Member not found in tontine');
    }

    const notification = new Notification();
    notification.message = messageNotification(data);
    notification.createdAt = new Date();
    notification.isRead = false;
    notification.tontine = tontine;
    if (data.memberId) {
      notification.target = { id: data.memberId } as any;
    }
    notification.type = data.type;

    return this.dataSource.getRepository(Notification).save(notification);
  }

  findAll(tontineId: number, memberId?: number) {
    const where: any = {
      tontine: { id: tontineId },
    };

    if (memberId) {
      where.target = { id: memberId };
    }

    return this.dataSource.getRepository(Notification).find({
      where,
      relations: ['target', 'target.user', 'tontine'],
      order: { createdAt: 'DESC' },
    });
  }

  async findFromTontine(tontineId: number,) {

    const tontine = await this.dataSource.getRepository(Tontine).findOne({ where: { id: tontineId } });
    if (!tontine) {
      throw new BadRequestException('Tontine not found');
    }

    const notifications = await this.dataSource.getRepository(Notification).find({
      where: { tontine: { id: tontineId } },
      order: { createdAt: 'DESC' },
      take: this.COUNT_NOTIFICATIONS,
    });
    return notifications.map((notification) => ({
      ...notification,
      createdAt: notification.createdAt.toISOString(),
      tontineId,
    }));
  }

  findOne(id: number) {
    return `This action returns a #${id} notification`;
  }

  update(id: number, updateNotificationDto: UpdateNotificationDto) {
    return `This action updates a #${id} notification`;
  }

  remove(id: number) {
    return `This action removes a #${id} notification`;
  }
}
