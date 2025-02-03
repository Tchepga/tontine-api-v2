import { Deposit } from 'src/tontine/entities/deposit.entity';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { Loan } from 'src/loan/entities/loan.entity';

export const messageNotificationCreate = {
    event: "Un évènement a été créé",
    tontine: 'Une tontine a été créée',
    member: 'Un membre a été créé',
    sanction: 'Une sanction a été créée',
    deposit: 'Un dépôt a été créé',
    loan: 'Un prêt a été créé',
};

export const messageNotificationUpdate = {
    event: "Un évènement a été modifié",
    tontine: 'Une tontine a été modifiée',
    member: 'Un membre a été modifié',
    sanction: 'Une sanction a été modifiée',
    deposit: 'Un dépôt a été modifié',
    loan: 'Un prêt a été modifié',
};

export const messageNotificationDelete = {
    event: "Un évènement a été supprimé",
    tontine: 'Une tontine a été supprimée',
    member: 'Un membre a été supprimé',
    sanction: 'Une sanction a été supprimée',
    deposit: 'Un dépôt a été supprimé',
    loan: 'Un prêt a été supprimé',
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
