import { IsEnum, IsNumber, Min } from 'class-validator';
import { Member } from '../../member/entities/member.entity';
import { StatusLoan } from '../enum/status-loan';

export class UpdateLoanDto {
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(1, { message: 'Amount must be at least 1' })
  amount?: number;

  @IsEnum(StatusLoan, {
    message: 'Status must be PENDING, ACCEPTED or REFUSED',
  })
  status?: StatusLoan;

  @IsEnum(['EUR', 'FCFA', 'USD'], {
    message: 'Currency must be one of the following: euro, fcfa, dollar',
  })
  currency?: string;

  voters?: Member[];
}
