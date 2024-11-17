import { IsEnum, IsNumber, Min } from 'class-validator';

export class CreateLoanDto {
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(1, { message: 'Amount must be at least 1' })
  amount: number;

  @IsEnum(['EURO', 'FCFA', 'USD'], {
    message: 'Currency must be one of the following: euro, fcfa, dollar',
  })
  currency: string;

  @IsNumber({}, { message: 'Tontine id must be a number' })
  tontineId: number;
}
