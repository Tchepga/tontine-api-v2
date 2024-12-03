import { IsIn, IsNumber, IsPositive, IsString } from 'class-validator';
import { Currency } from '../enum/shared';
import { StatusDeposit } from '../enum/status-deposit';

export class CreateDepositDto {
  @IsPositive({ message: 'Le montant doit être positif' })
  amount: number;

  @IsIn([Currency.FRANC, Currency.EUR], {
    message: 'La devise doit être FCFA ou EUR',
  })
  currency: Currency | undefined;

  @IsPositive({ message: 'Le membre doit être un entier' })
  memberId: number;

  @IsIn(Object.values(StatusDeposit), {
    message: 'Le statut doit être PENDING, APPROVED ou REJECTED',
  })
  status: StatusDeposit | undefined;

  @IsNumber()
  cashFlowId: number;

  @IsString()
  reasons: string | undefined;
}
