import {
  BadRequestException,
  Injectable,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { DataSource, LessThan } from 'typeorm';
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

  /**
   * Supprime les notifications de plus d'un mois pour une tontine
   * @param tontineId ID de la tontine
   * @param memberId ID du membre (optionnel, pour filtrer par membre)
   */
  private async deleteOldNotifications(
    tontineId: number,
    memberId?: number,
  ): Promise<void> {
    // Calculer la date d'il y a un mois
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Construire la condition de suppression
    const deleteCondition: any = {
      tontine: { id: tontineId },
      createdAt: LessThan(oneMonthAgo),
    };

    // Si un memberId est spécifié, supprimer uniquement ses notifications
    if (memberId) {
      deleteCondition.target = { id: memberId };
    }

    try {
      const deleteResult = await this.dataSource
        .getRepository(Notification)
        .delete(deleteCondition);

      if (deleteResult.affected && deleteResult.affected > 0) {
        const memberInfo = memberId ? ` pour le membre ${memberId}` : '';
        this.logger.log(
          `Suppression de ${deleteResult.affected} notification(s) de plus d'un mois pour la tontine ${tontineId}${memberInfo}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Erreur lors de la suppression des anciennes notifications: ${error.message}`,
        error.stack,
      );
      // Ne pas faire échouer la requête si la suppression échoue
    }
  }

  async findAll(tontineId: number, memberId?: number) {
    // Supprimer les notifications de plus d'un mois avant de récupérer
    await this.deleteOldNotifications(tontineId, memberId);

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

    // Supprimer les notifications de plus d'un mois pour cette tontine
    await this.deleteOldNotifications(tontineId);

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

  findOne(id: number) {
    return `This action returns a #${id} notification`;
  }

  async updateStatusRead(id: number) {
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
  }

  remove(id: number) {
    return `This action removes a #${id} notification`;
  }
}
