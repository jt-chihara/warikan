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
  groupId: string;
  amount: number;
  description: string;
  paidById: string;
  paidByName: string;
  splitMembers: SplitMember[];
  createdAt: string;
}

export interface SplitMember {
  memberId: string;
  memberName: string;
  amount: number;
}

export interface AddExpenseInput {
  groupId: string;
  amount: number;
  description: string;
  paidById: string;
  splitMemberIds: string[];
}

export interface UpdateExpenseInput {
  expenseId: string;
  amount: number;
  description: string;
  paidById: string;
  splitMemberIds: string[];
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

// For calculating settlements
export interface ExpenseInput {
  id: string;
  payerId: string;
  amount: number;
  splitBetween: string[];
}
