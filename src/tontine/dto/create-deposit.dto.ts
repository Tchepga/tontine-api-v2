import { IsIn, IsPositive, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Currency } from '../enum/shared';
import { StatusDeposit } from '../enum/status-deposit';

export class CreateDepositDto {
  @ApiProperty({
    description: 'Montant du dépôt',
    example: 50000,
  })
  @IsPositive({ message: 'Le montant doit être positif' })
  amount: number;

  @ApiProperty({
    description: 'Devise du dépôt',
    enum: Currency,
    example: Currency.FCFA,
    required: false,
  })
  @IsIn([Currency.FCFA, Currency.EUR], {
    message: 'La devise doit être FCFA ou EUR',
  })
  currency: Currency | undefined;

  @ApiProperty({
    description: 'ID du membre qui effectue le dépôt',
    example: 1,
  })
  @IsPositive({ message: 'Le membre doit être un entier' })
  memberId: number;

  @ApiProperty({
    description: 'Statut initial du dépôt (généralement PENDING)',
    enum: StatusDeposit,
    example: StatusDeposit.PENDING,
    required: false,
  })
  @IsIn(Object.values(StatusDeposit), {
    message: 'Le statut doit être PENDING, APPROVED ou REJECTED',
  })
  status: StatusDeposit | undefined;

  @ApiProperty({
    description: 'ID du flux de trésorerie',
    example: 1,
  })
  @IsPositive({ message: 'Le cashflow doit être un entier' })
  cashFlowId: number;

  @ApiProperty({
    description: 'Raison ou description du dépôt',
    example: 'Cotisation mensuelle de janvier',
    required: false,
  })
  @IsString()
  reasons: string | undefined;
}
