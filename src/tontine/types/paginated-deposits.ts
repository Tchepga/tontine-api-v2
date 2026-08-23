import { Deposit } from '../entities/deposit.entity';

export interface PaginatedDepositsResponse {
  items: Deposit[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
