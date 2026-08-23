export interface MemberClosureShare {
  memberId: number;
  firstname: string;
  lastname: string;
  totalDeposits: number;
  shareAmount: number;
  sharePercent: number;
}

export interface MemberContribution {
  memberId: number;
  firstname: string;
  lastname: string;
  username: string;
  totalApproved: number;
  totalPending: number;
  totalRejected: number;
  depositCount: number;
  lastDeposit: string | null;
  sharePercent: number;
  shareAmount: number;
}

export interface ClosureSnapshot {
  remainingBalance: number;
  currency: string;
  cashflowAmount: number;
  dividendes: number;
  memberShares: MemberClosureShare[];
}

export interface ClosureSummaryResponse {
  tontineId: number;
  closedAt: Date;
  remainingBalance: number;
  currency: string;
  memberShares: MemberClosureShare[];
}
