import type { Expense, Member } from '../types/group';
import { timestampToDate } from './timestampUtils';

// 日付をYYYY-MM-DD形式でフォーマット
export const formatDateForChart = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

// 月別の支払い集計データ
export interface MonthlyExpenseData {
  month: string;
  amount: number;
  count: number;
}

// メンバー別支払いデータ
export interface MemberExpenseData {
  memberName: string;
  memberId: string;
  totalPaid: number;
  expenseCount: number;
  color: string;
}

// 日別支払いデータ
export interface DailyExpenseData {
  date: string;
  amount: number;
  count: number;
}

// カテゴリ別データ（支払い内容から推測）
export interface CategoryData {
  category: string;
  amount: number;
  count: number;
  color: string;
}

// 月別支払い集計
export const aggregateExpensesByMonth = (expenses: Expense[]): MonthlyExpenseData[] => {
  const monthlyData = new Map<string, { amount: number; count: number }>();

  expenses.forEach((expense) => {
    const date = timestampToDate(expense.createdAt);
    // 日付が無効な場合は警告を出力
    if (Number.isNaN(date.getTime())) {
      console.warn(`Invalid date:`, expense.createdAt);
      return;
    }
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    const existing = monthlyData.get(monthKey) || { amount: 0, count: 0 };
    monthlyData.set(monthKey, {
      amount: existing.amount + expense.amount,
      count: existing.count + 1,
    });
  });

  return Array.from(monthlyData.entries())
    .map(([month, data]) => ({
      month,
      amount: data.amount,
      count: data.count,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
};

// 日別支払い集計（過去30日）
export const aggregateExpensesByDay = (expenses: Expense[]): DailyExpenseData[] => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const dailyData = new Map<string, { amount: number; count: number }>();

  // 過去30日の初期化
  for (let i = 0; i < 30; i++) {
    const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
    const dateKey = formatDateForChart(date.toISOString());
    dailyData.set(dateKey, { amount: 0, count: 0 });
  }

  // 実際のデータを集計
  expenses.forEach((expense) => {
    const expenseDate = timestampToDate(expense.createdAt);
    if (expenseDate >= thirtyDaysAgo && expenseDate <= now) {
      const dateKey = formatDateForChart(expenseDate.toISOString());
      const existing = dailyData.get(dateKey) || { amount: 0, count: 0 };
      dailyData.set(dateKey, {
        amount: existing.amount + expense.amount,
        count: existing.count + 1,
      });
    }
  });

  return Array.from(dailyData.entries())
    .map(([date, data]) => ({
      date,
      amount: data.amount,
      count: data.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

// メンバー別支払い集計
const MEMBER_COLORS = [
  '#3B82F6', // blue-500
  '#EF4444', // red-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#6B7280', // gray-500
  '#84CC16', // lime-500
];

export const aggregateExpensesByMember = (
  expenses: Expense[],
  members: Member[],
): MemberExpenseData[] => {
  const memberData = new Map<string, { totalPaid: number; expenseCount: number }>();

  // メンバー初期化
  members.forEach((member) => {
    memberData.set(member.id, { totalPaid: 0, expenseCount: 0 });
  });

  // 支払いデータ集計
  expenses.forEach((expense) => {
    const existing = memberData.get(expense.paidById) || { totalPaid: 0, expenseCount: 0 };
    memberData.set(expense.paidById, {
      totalPaid: existing.totalPaid + expense.amount,
      expenseCount: existing.expenseCount + 1,
    });
  });

  return Array.from(memberData.entries())
    .map(([memberId, data], index) => {
      const member = members.find((m) => m.id === memberId);
      return {
        memberName: member?.name || '不明',
        memberId,
        totalPaid: data.totalPaid,
        expenseCount: data.expenseCount,
        color: MEMBER_COLORS[index % MEMBER_COLORS.length],
      };
    })
    .filter((data) => data.totalPaid > 0) // 支払いがあるメンバーのみ
    .sort((a, b) => b.totalPaid - a.totalPaid);
};

// カテゴリ推測（支払い内容から）
const categorizeExpense = (description: string): string => {
  const desc = description.toLowerCase();

  if (
    desc.includes('食事') ||
    desc.includes('ランチ') ||
    desc.includes('ディナー') ||
    desc.includes('朝食') ||
    desc.includes('レストラン') ||
    desc.includes('カフェ')
  ) {
    return '食事';
  }
  if (
    desc.includes('交通') ||
    desc.includes('電車') ||
    desc.includes('バス') ||
    desc.includes('タクシー') ||
    desc.includes('ガソリン')
  ) {
    return '交通費';
  }
  if (desc.includes('宿泊') || desc.includes('ホテル') || desc.includes('旅館')) {
    return '宿泊費';
  }
  if (desc.includes('買い物') || desc.includes('ショッピング') || desc.includes('お土産')) {
    return '買い物';
  }
  if (
    desc.includes('娯楽') ||
    desc.includes('映画') ||
    desc.includes('ゲーム') ||
    desc.includes('アミューズメント')
  ) {
    return '娯楽';
  }
  return 'その他';
};

const CATEGORY_COLORS: Record<string, string> = {
  食事: '#EF4444', // red-500
  交通費: '#3B82F6', // blue-500
  宿泊費: '#10B981', // emerald-500
  買い物: '#F59E0B', // amber-500
  娯楽: '#8B5CF6', // violet-500
  その他: '#6B7280', // gray-500
};

export const aggregateExpensesByCategory = (expenses: Expense[]): CategoryData[] => {
  const categoryData = new Map<string, { amount: number; count: number }>();

  expenses.forEach((expense) => {
    const category = categorizeExpense(expense.description);
    const existing = categoryData.get(category) || { amount: 0, count: 0 };
    categoryData.set(category, {
      amount: existing.amount + expense.amount,
      count: existing.count + 1,
    });
  });

  return Array.from(categoryData.entries())
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
      color: CATEGORY_COLORS[category] || CATEGORY_COLORS['その他'],
    }))
    .sort((a, b) => b.amount - a.amount);
};

// 金額をフォーマット（3桁区切り）
export const formatCurrency = (amount: number, currency: string = 'JPY'): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
};
