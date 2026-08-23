import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { DepositType } from '../enum/deposit-type';

export const DEPOSITS_DEFAULT_PAGE = 1;
export const DEPOSITS_DEFAULT_LIMIT = 20;
export const DEPOSITS_MAX_LIMIT = 100;

export type DepositStatusFilter = 'PENDING' | 'VALIDATED' | 'REJECTED';

export class GetDepositsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(DEPOSITS_MAX_LIMIT)
  limit?: number;

  @IsOptional()
  @IsIn(['PENDING', 'VALIDATED', 'REJECTED'])
  status?: DepositStatusFilter;

  @IsOptional()
  @IsIn(Object.values(DepositType))
  type?: DepositType;

  @IsOptional()
  @IsString()
  search?: string;
}
