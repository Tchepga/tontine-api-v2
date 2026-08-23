import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
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
import { isMemberOfTontine } from 'src/tontine/utilities/service.helper';

@Injectable()
export class NotificationService {
  private readonly COUNT_NOTIFICATIONS = 10;

  constructor(private readonly dataSource: DataSource) { }

  async create(data: CreateNotificationDto, user: User) {

    const tontine = await this.dataSource.getRepository(Tontine).findOne({
      where: { id: data.tontineId },
      relations: ['members', 'members.user'],
    });
    if (!tontine) {
      throw new BadRequestException('Tontine not found');
    }

    if (!isMemberOfTontine(tontine, user.username)) {
      throw new ForbiddenException(
        "Vous n'êtes pas membre de cette tontine.",
      );
    }

    const member = await this.dataSource.getRepository(Member).findOne({
      where: { user: { username: user.username } },
      relations: ['user', 'notifications']
    });
    if (!member) {
      throw new BadRequestException('Member not found');
    }


    const notification = new Notification();
    notification.message = messageNotification(data);
    notification.createdAt = new Date();
    notification.isRead = false;
    notification.tontine = tontine;
    notification.type = data.type;
    // notification.target = member;

    await this.dataSource.getRepository(Notification).save(notification);
    if (!member.notifications) {
      member.notifications = [];
    }
    member.notifications.push(notification);
    await this.dataSource.getRepository(Member).save(member, { reload: true });
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

  async findFromTontine(tontineId: number, username: string) {

    const tontine = await this.dataSource.getRepository(Tontine).findOne({
      where: { id: tontineId },
      relations: ['members', 'members.user'],
    });
    if (!tontine) {
      throw new BadRequestException('Tontine not found');
    }

    if (!isMemberOfTontine(tontine, username)) {
      throw new ForbiddenException(
        "Vous n'êtes pas membre de cette tontine.",
      );
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
