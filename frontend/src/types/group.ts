export interface Group {
  id: string;
  name: string;
  description?: string;
  currency: string;
  createdAt: string;
  updatedAt?: string;
  members: Member[];
}

export interface Member {
  id: string;
  name: string;
  email?: string;
  joinedAt: string;
}

export interface CreateGroupInput {
  name: string;
  description?: string;
  currency: string;
  memberNames: string[];
}

export interface Expense {
  id: string;
  payerId: string;
  amount: number;
  description?: string;
  splitBetween: string[];
  createdAt?: string;
}

export interface Settlement {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  fromName: string;
  toName: string;
}

export interface MemberBalance {
  memberId: string;
  memberName: string;
  balance: number;
}

export interface SettlementResult {
  settlements: Settlement[];
  balances: MemberBalance[];
}