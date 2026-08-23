import { IsIn, IsOptional, IsPositive, IsString, IsDateString } from 'class-validator';
import { Currency } from '../enum/shared';
import { StatusDeposit } from '../enum/status-deposit';

export class CreateDepositDto {
  @IsPositive({ message: 'Le montant doit être positif' })
  amount: number;

  @IsIn([Currency.FCFA, Currency.EUR], {
    message: 'La devise doit être FCFA ou EUR',
  })
  currency: Currency | undefined;

  @IsPositive({ message: 'Le membre doit être un entier' })
  memberId: number;

  @IsIn(Object.values(StatusDeposit), {
    message: 'Le statut doit être PENDING, APPROVED ou REJECTED',
  })
  status: StatusDeposit | undefined;

  @IsPositive({ message: 'Le cashflow doit être un entier' })
  cashFlowId: number;

  @IsString()
  @IsOptional()
  reasons: string | undefined;

  /** Date du versement (ISO). Par défaut : aujourd'hui côté serveur. */
  @IsOptional()
  @IsDateString({}, { message: 'La date du versement est invalide' })
  creationDate?: string;
}
