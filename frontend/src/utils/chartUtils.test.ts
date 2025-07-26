import { describe, expect, it } from 'vitest';
import type { Expense, Member } from '../types/group';
import {
  aggregateExpensesByCategory,
  aggregateExpensesByDay,
  aggregateExpensesByMember,
  aggregateExpensesByMonth,
  formatCurrency,
  formatDateForChart,
} from './chartUtils';

// テスト用のモックデータ
const mockMembers: Member[] = [
  { id: 'member1', name: 'Alice', email: 'alice@example.com', joinedAt: '2024-01-01' },
  { id: 'member2', name: 'Bob', email: 'bob@example.com', joinedAt: '2024-01-01' },
];

const mockExpenses: Expense[] = [
  {
    id: 'expense1',
    groupId: 'group1',
    amount: 1000,
    description: 'ランチ代',
    paidById: 'member1',
    paidByName: 'Alice',
    splitMembers: [
      { memberId: 'member1', memberName: 'Alice', amount: 500 },
      { memberId: 'member2', memberName: 'Bob', amount: 500 },
    ],
    createdAt: '2024-01-15T12:00:00Z',
  },
  {
    id: 'expense2',
    groupId: 'group1',
    amount: 2000,
    description: '交通費',
    paidById: 'member2',
    paidByName: 'Bob',
    splitMembers: [
      { memberId: 'member1', memberName: 'Alice', amount: 1000 },
      { memberId: 'member2', memberName: 'Bob', amount: 1000 },
    ],
    createdAt: '2024-02-01T10:00:00Z',
  },
  {
    id: 'expense3',
    groupId: 'group1',
    amount: 3000,
    description: '宿泊費',
    paidById: 'member1',
    paidByName: 'Alice',
    splitMembers: [
      { memberId: 'member1', memberName: 'Alice', amount: 1500 },
      { memberId: 'member2', memberName: 'Bob', amount: 1500 },
    ],
    createdAt: '2024-02-15T15:00:00Z',
  },
];

describe('chartUtils', () => {
  describe('formatDateForChart', () => {
    it('formats date string correctly', () => {
      const result = formatDateForChart('2024-01-15T12:00:00Z');
      expect(result).toBe('2024-01-15');
    });

    it('handles different date formats', () => {
      const result = formatDateForChart('2024-02-29T23:59:59.999Z');
      expect(result).toBe('2024-02-29');
    });
  });

  describe('formatCurrency', () => {
    it('formats JPY currency correctly', () => {
      const result = formatCurrency(1000, 'JPY');
      expect(result).toBe('￥1,000');
    });

    it('formats with default JPY currency', () => {
      const result = formatCurrency(1500);
      expect(result).toBe('￥1,500');
    });

    it('handles zero amount', () => {
      const result = formatCurrency(0);
      expect(result).toBe('￥0');
    });
  });

  describe('aggregateExpensesByMonth', () => {
    it('aggregates expenses by month correctly', () => {
      const result = aggregateExpensesByMonth(mockExpenses);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        month: '2024-01',
        amount: 1000,
        count: 1,
      });
      expect(result[1]).toEqual({
        month: '2024-02',
        amount: 5000, // 2000 + 3000
        count: 2,
      });
    });

    it('returns empty array for no expenses', () => {
      const result = aggregateExpensesByMonth([]);
      expect(result).toEqual([]);
    });
  });

  describe('aggregateExpensesByMember', () => {
    it('aggregates expenses by member correctly', () => {
      const result = aggregateExpensesByMember(mockExpenses, mockMembers);

      expect(result).toHaveLength(2);

      const alice = result.find((m) => m.memberName === 'Alice');
      const bob = result.find((m) => m.memberName === 'Bob');

      expect(alice).toEqual({
        memberName: 'Alice',
        memberId: 'member1',
        totalPaid: 4000, // 1000 + 3000
        expenseCount: 2,
        color: expect.any(String),
      });

      expect(bob).toEqual({
        memberName: 'Bob',
        memberId: 'member2',
        totalPaid: 2000,
        expenseCount: 1,
        color: expect.any(String),
      });
    });

    it('handles members with no expenses', () => {
      const membersWithNoExpenses = [
        ...mockMembers,
        { id: 'member3', name: 'Charlie', email: 'charlie@example.com', joinedAt: '2024-01-01' },
      ];

      const result = aggregateExpensesByMember(mockExpenses, membersWithNoExpenses);

      // Charlieは支払いがないので除外される
      expect(result).toHaveLength(2);
      expect(result.find((m) => m.memberName === 'Charlie')).toBeUndefined();
    });
  });

  describe('aggregateExpensesByCategory', () => {
    it('categorizes expenses correctly', () => {
      const result = aggregateExpensesByCategory(mockExpenses);

      expect(result).toHaveLength(3);

      const categories = result.map((c) => c.category);
      expect(categories).toContain('食事');
      expect(categories).toContain('交通費');
      expect(categories).toContain('宿泊費');

      const foodCategory = result.find((c) => c.category === '食事');
      expect(foodCategory).toEqual({
        category: '食事',
        amount: 1000,
        count: 1,
        color: expect.any(String),
      });
    });

    it('handles unknown categories as その他', () => {
      const unknownExpense: Expense = {
        id: 'expense4',
        groupId: 'group1',
        amount: 500,
        description: '謎の支払い',
        paidById: 'member1',
        paidByName: 'Alice',
        splitMembers: [],
        createdAt: '2024-01-01T00:00:00Z',
      };

      const result = aggregateExpensesByCategory([unknownExpense]);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        category: 'その他',
        amount: 500,
        count: 1,
        color: expect.any(String),
      });
    });
  });

  describe('aggregateExpensesByDay', () => {
    it('returns 30 days of data', () => {
      // 過去30日のデータが必要なので、最近の日付でテストデータを作成
      const now = new Date();
      const recentExpense: Expense = {
        id: 'recent1',
        groupId: 'group1',
        amount: 1000,
        description: '最近の支払い',
        paidById: 'member1',
        paidByName: 'Alice',
        splitMembers: [],
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5日前
      };

      const result = aggregateExpensesByDay([recentExpense]);

      expect(result).toHaveLength(30);
      expect(result.every((day) => typeof day.amount === 'number')).toBe(true);
      expect(result.every((day) => typeof day.count === 'number')).toBe(true);
    });

    it('excludes expenses older than 30 days', () => {
      const result = aggregateExpensesByDay(mockExpenses); // これらは30日より古い

      expect(result).toHaveLength(30);
      // 全ての日の支払いが0になる（古いデータのため）
      expect(result.every((day) => day.amount === 0 && day.count === 0)).toBe(true);
    });
  });
});
