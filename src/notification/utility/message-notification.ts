import { Deposit } from 'src/tontine/entities/deposit.entity';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { Loan } from 'src/loan/entities/loan.entity';

export const messageNotificationCreate = {
    event: "L'évènement a été créé",
    tontine: 'La tontine a été créée',
    member: 'Le membre a été créé',
    sanction: 'La sanction a été créée',
    deposit: 'Le dépôt a été créé',
    loan: 'Le prêt a été créé',
};

export const messageNotificationUpdate = {
    event: "L'évènement a été modifié",
    tontine: 'La tontine a été modifiée',
    member: 'Le membre a été modifié',
    sanction: 'La sanction a été modifiée',
    deposit: 'Le dépôt a été modifié',
    loan: 'Le prêt a été modifié',
};

export const messageNotificationDelete = {
    event: "L'évènement a été supprimé",
    tontine: 'La tontine a été supprimée',
    member: 'Le membre a été supprimé',
    sanction: 'La sanction a été supprimée',
    deposit: 'Le dépôt a été supprimé',
    loan: 'Le prêt a été supprimé',
};

export enum Action {
    CREATE = 'CREATED',
    UPDATE = 'UPDATED',
    DELETE = 'DELETED',
}

export function messageNotification(notificationDto: CreateNotificationDto) {
    switch (notificationDto.action) {
        case Action.CREATE:
            return messageNotificationCreate[notificationDto.type];
        case Action.UPDATE:
            return messageNotificationUpdate[notificationDto.type];
        case Action.DELETE:
            return messageNotificationDelete[notificationDto.type];
        default:
            return '';
    }
}

export function messageDeposit(
    notificationDto: CreateNotificationDto,
    deposit: Deposit,
) {
    return `Le dépôt ${deposit.amount} a été ${notificationDto.action}`;
}

export function messageLoan(
    notificationDto: CreateNotificationDto,
    loan: Loan,
) {
    return `Le prêt ${loan.amount} a été ${notificationDto.action}`;
}
