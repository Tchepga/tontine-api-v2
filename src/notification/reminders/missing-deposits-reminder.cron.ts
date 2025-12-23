import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { Tontine } from '../../tontine/entities/tontine.entity';
import { Deposit } from '../../tontine/entities/deposit.entity';
import { StatusDeposit } from '../../tontine/enum/status-deposit';
import { Notification } from '../entities/notification.entity';
import { TypeNotification } from '../enum/type-notification';
import { NotificationGateway } from '../notification.gateway';
import { Member } from '../../member/entities/member.entity';
import { DeviceToken } from '../../device-tokens/entities/device-token.entity';
import { PushNotificationService } from '../push-notification.service';

@Injectable()
export class MissingDepositsReminderCron {
  private readonly logger = new Logger(MissingDepositsReminderCron.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly notificationGateway: NotificationGateway,
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  @Cron('0 18 * * *')
  async handleCron() {
    const now = new Date();

    // On déclenche uniquement le dernier jour du mois (fuseau serveur)
    const isLastDay =
      now.getDate() === new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    if (!isLastDay) return;

    const year = now.getFullYear();
    const monthIndex = now.getMonth(); // 0-based
    const monthStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

    const startOfMonth = new Date(year, monthIndex, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

    // Récupérer les tontines avec le rappel activé
    const tontines = await this.dataSource
      .getRepository(Tontine)
      .createQueryBuilder('t')
      .innerJoinAndSelect('t.config', 'config')
      .innerJoinAndSelect('t.cashFlow', 'cashFlow')
      .leftJoinAndSelect('config.partOrders', 'partOrders')
      .leftJoinAndSelect('partOrders.member', 'partMember')
      .where('config.reminderMissingDepositsEnabled = :enabled', {
        enabled: true,
      })
      .getMany();

    if (!tontines.length) return;

    for (const tontine of tontines) {
      try {
        const parts = tontine.config?.partOrders ?? [];
        const currentPart = parts.find((p) => {
          const d = new Date(p.period);
          return d.getFullYear() === year && d.getMonth() === monthIndex;
        });

        if (!currentPart || !currentPart.member) continue;

        const beneficiary = currentPart.member;
        const beneficiaryName = `${beneficiary.firstname} ${beneficiary.lastname}`.trim();

        const eligibleMembers = (tontine.members ?? []).filter(
          (m) => m.id !== beneficiary.id,
        );
        if (!eligibleMembers.length) continue;

        // Membres ayant déjà un dépôt VALIDÉ sur le mois courant
        const paidRows = await this.dataSource
          .getRepository(Deposit)
          .createQueryBuilder('d')
          // colonnes de relation ManyToOne : d.authorId / d.cashFlowId
          .select('DISTINCT d.authorId', 'authorId')
          .where('d.cashFlowId = :cashFlowId', { cashFlowId: tontine.cashFlow.id })
          .andWhere('d.status = :status', { status: StatusDeposit.APPROVED })
          .andWhere('d.creationDate BETWEEN :start AND :end', {
            start: startOfMonth,
            end: endOfMonth,
          })
          .getRawMany<{ authorId: number }>();

        const paidMemberIds = new Set<number>(
          paidRows.map((r) => Number(r.authorId)).filter((x) => !Number.isNaN(x)),
        );

        const missingMembers = eligibleMembers.filter((m) => !paidMemberIds.has(m.id));
        if (!missingMembers.length) continue;

        for (const missing of missingMembers) {
          const dedupKey = `missing-deposit:${tontine.id}:${monthStr}:${missing.id}`;

          const alreadySent = await this.dataSource.getRepository(Notification).findOne({
            where: { dedupKey },
          });
          if (alreadySent) continue;

          const message = `Rappel : votre versement pour la tontine "${tontine.title}" (bénéficiaire: ${beneficiaryName}) est manquant. Merci de régulariser avant la fin du mois.`;

          const notification = new Notification();
          notification.type = TypeNotification.REMINDER;
          notification.message = message;
          notification.createdAt = new Date();
          notification.isRead = false;
          notification.tontine = tontine;
          notification.target = missing;
          notification.dedupKey = dedupKey;

          const saved = await this.dataSource.getRepository(Notification).save(notification);

          // Push notification (FCM/APNs via FCM) si des tokens sont enregistrés
          try {
            const memberWithUser = await this.dataSource
              .getRepository(Member)
              .findOne({ where: { id: missing.id }, relations: ['user'] });
            const username = memberWithUser?.user?.username;
            if (username) {
              const tokenRows = await this.dataSource
                .getRepository(DeviceToken)
                .find({ where: { user: { username } as any } });
              const tokens = tokenRows.map((t) => t.token).filter(Boolean);

              await this.pushNotificationService.sendToTokens({
                tokens,
                title: 'Rappel de versement',
                body: `Votre versement pour "${tontine.title}" est manquant.`,
                data: {
                  type: 'reminder',
                  tontineId: String(tontine.id),
                  notificationId: String(saved.id),
                },
              });
            }
          } catch (e: any) {
            this.logger.warn(
              `Push non envoyé (member ${missing.id}): ${e?.message ?? e}`,
            );
          }

          // 1) Event dédié (pour notification locale côté app)
          await this.notificationGateway.emitEventToMember(
            missing.id,
            'reminder.missing_deposits',
            {
              tontineId: tontine.id,
              tontineName: tontine.title,
              beneficiaryName,
              missingCount: missingMembers.length,
              message,
              notificationId: saved.id,
            },
          );

          // 2) Event générique "notification" (compatibilité)
          await this.notificationGateway.emitToMember(missing.id, {
            id: saved.id,
            message: saved.message,
            type: saved.type,
            createdAt: saved.createdAt.toISOString(),
            isRead: saved.isRead,
            tontineId: tontine.id,
            targetId: missing.id,
          });
        }
      } catch (e: any) {
        this.logger.error(
          `Erreur cron rappel (tontine ${tontine.id}): ${e?.message ?? e}`,
        );
      }
    }
  }
}


