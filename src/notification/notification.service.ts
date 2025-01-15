import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Notification } from './entities/notification.entity';
import {
  messageDeposit,
  messageNotification,
} from './utility/message-notification';
import { Deposit } from 'src/tontine/entities/deposit.entity';
@Injectable()
export class NotificationService {
  private readonly COUNT_NOTIFICATIONS = 10;

  constructor(@InjectDataSource() private dataSource: DataSource) { }
  async create(createNotificationDto: CreateNotificationDto) {
    const notification = new Notification();
    notification.createdAt = new Date();
    notification.isRead = false;

    if (createNotificationDto.depositId) {
      const deposit = await this.dataSource.manager.findOne(Deposit, {
        where: { id: createNotificationDto.depositId },
      });
      if (!deposit) {
        throw new NotFoundException(
          'Deposit not found during notification creation',
        );
      }
      notification.message = messageDeposit(createNotificationDto, deposit);
    }
    notification.message = messageNotification(createNotificationDto);
    return this.dataSource.manager.save(Notification, notification);
  }

  async findFromTontine(tontineId: number) {
    const notifications = await this.dataSource.manager.find(Notification, {
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
