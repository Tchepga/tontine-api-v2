import {
  BadRequestException,
  Injectable,
  Inject,
  forwardRef,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Notification } from './entities/notification.entity';
import { messageNotification } from './utility/message-notification';
import { Tontine } from '../tontine/entities/tontine.entity';
import { User } from '../authentification/entities/user.entity';
import { Member } from '../member/entities/member.entity';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
  private readonly COUNT_NOTIFICATIONS = 10;
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => NotificationGateway))
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async create(data: CreateNotificationDto, user: User) {
    const tontine = await this.dataSource.getRepository(Tontine).findOne({
      where: { id: data.tontineId },
      relations: ['members'],
    });
    if (!tontine) {
      throw new BadRequestException('Tontine not found');
    }

    const member = await this.dataSource.getRepository(Member).findOne({
      where: { user: { username: user.username } },
      relations: ['user', 'notifications'],
    });
    if (!member) {
      throw new BadRequestException('Member not found');
    }
    if (!tontine.members.some((m) => m.id === member.id)) {
      throw new BadRequestException('Member not found in tontine');
    }

    // Déterminer le membre destinataire si spécifié
    let targetMember: Member | null = null;
    if (data.memberId) {
      targetMember = await this.dataSource.getRepository(Member).findOne({
        where: { id: data.memberId },
      });
      if (!targetMember) {
        throw new BadRequestException('Target member not found');
      }
    }

    const notification = new Notification();
    notification.message = messageNotification(data);
    notification.createdAt = new Date();
    notification.isRead = false;
    notification.tontine = tontine;
    notification.type = data.type;
    if (targetMember) {
      notification.target = targetMember;
    }

    const savedNotification = await this.dataSource
      .getRepository(Notification)
      .save(notification);

    if (!member.notifications) {
      member.notifications = [];
    }
    member.notifications.push(savedNotification);
    await this.dataSource.getRepository(Member).save(member, { reload: true });

    // Émettre la notification via WebSocket
    try {
      const notificationPayload = {
        id: savedNotification.id,
        message: savedNotification.message,
        type: savedNotification.type,
        createdAt: savedNotification.createdAt.toISOString(),
        isRead: savedNotification.isRead,
        tontineId: tontine.id,
        targetId: targetMember?.id,
      };

      if (targetMember) {
        // Envoyer uniquement au membre cible
        await this.notificationGateway.emitToMember(
          targetMember.id,
          notificationPayload,
        );
      } else {
        // Envoyer à tous les membres de la tontine
        await this.notificationGateway.emitToTontine(
          tontine.id,
          notificationPayload,
        );
      }
    } catch (error) {
      // Ne pas faire échouer la création si l'émission WebSocket échoue
      this.logger.warn(
        `Erreur lors de l'émission WebSocket de la notification: ${error.message}`,
      );
    }

    return savedNotification;
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

  async findFromTontine(tontineId: number) {
    const tontine = await this.dataSource
      .getRepository(Tontine)
      .findOne({ where: { id: tontineId } });
    if (!tontine) {
      throw new BadRequestException('Tontine not found');
    }

    const notifications = await this.dataSource
      .getRepository(Notification)
      .find({
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

  async updateStatusRead(id: number) {
    try {
      const notification = await this.dataSource
        .getRepository(Notification)
        .findOne({
          where: { id },
        });
      if (!notification) {
        throw new BadRequestException('Notification not found');
      }
      notification.isRead = true;
      await this.dataSource.getRepository(Notification).save(notification);
      return notification;
    } catch (error) {
      this.logger.warn(
        `Erreur lors de la mise à jour du statut de lecture de la notification: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Erreur lors de la mise à jour du statut de lecture de la notification' +
          error.message,
      );
    }
  }

  remove(id: number) {
    return `This action removes a #${id} notification`;
  }
}
