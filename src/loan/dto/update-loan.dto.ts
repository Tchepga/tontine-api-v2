import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { Member } from 'src/member/entities/member.entity';
import { StatusLoan } from '../enum/status-loan';

export class UpdateLoanDto {
  @IsOptional()
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(1, { message: 'Amount must be at least 1' })
  amount?: number;

  @IsOptional()
  @IsEnum(StatusLoan, {
    message:
      'Status must be PENDING, APPROVED, PAID, CANCELLED or REJECTED',
  })
  status?: StatusLoan;

  @IsOptional()
  @IsEnum(['EUR', 'FCFA', 'USD'], {
    message: 'Currency must be one of the following: euro, fcfa, dollar',
  })
  currency?: string;

  voters?: Member[];
}
