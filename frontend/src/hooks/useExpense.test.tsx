import { gql } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { AddExpenseInput, Expense } from '../types/group';
import { useAddExpense, useDeleteExpense, useGroupExpenses } from './useExpense';

const mockExpense: Expense = {
  id: 'expense-123',
  groupId: 'group-123',
  amount: 1500,
  description: 'ランチ代',
  paidById: 'member-1',
  paidByName: 'Alice',
  splitMembers: [
    { memberId: 'member-1', memberName: 'Alice', amount: 750 },
    { memberId: 'member-2', memberName: 'Bob', amount: 750 },
  ],
  createdAt: '2024-01-01T12:00:00Z',
};

const mockAddExpenseInput: AddExpenseInput = {
  groupId: 'group-123',
  amount: 1500,
  description: 'ランチ代',
  paidById: 'member-1',
  splitMemberIds: ['member-1', 'member-2'],
};

const mockExpenses: Expense[] = [
  mockExpense,
  {
    id: 'expense-456',
    groupId: 'group-123',
    amount: 2000,
    description: 'ディナー',
    paidById: 'member-2',
    paidByName: 'Bob',
    splitMembers: [
      { memberId: 'member-1', memberName: 'Alice', amount: 1000 },
      { memberId: 'member-2', memberName: 'Bob', amount: 1000 },
    ],
    createdAt: '2024-01-02T19:00:00Z',
  },
];

const ADD_EXPENSE = gql`
  mutation AddExpense($input: AddExpenseInput!) {
    addExpense(input: $input) {
      id
      groupId
      amount
      description
      paidById
      paidByName
      splitMembers {
        memberId
        memberName
        amount
      }
      createdAt
    }
  }
`;

const GET_GROUP_EXPENSES = gql`
  query GetGroupExpenses($groupId: ID!) {
    groupExpenses(groupId: $groupId) {
      id
      groupId
      amount
      description
      paidById
      paidByName
      splitMembers {
        memberId
        memberName
        amount
      }
      createdAt
    }
  }
`;

const DELETE_EXPENSE = gql`
  mutation DeleteExpense($expenseId: ID!) {
    deleteExpense(expenseId: $expenseId)
  }
`;

describe('useAddExpense', () => {
  it('支払いを正常に追加する', async () => {
    const addExpenseMock = {
      request: {
        query: ADD_EXPENSE,
        variables: { input: mockAddExpenseInput },
      },
      result: {
        data: { addExpense: mockExpense },
      },
    };

    const { result } = renderHook(() => useAddExpense(), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={[addExpenseMock]} addTypename={false}>
          {children}
        </MockedProvider>
      ),
    });

    const [addExpense] = result.current;

    let response: Awaited<ReturnType<typeof addExpense>>;
    await act(async () => {
      response = await addExpense({
        variables: { input: mockAddExpenseInput },
      });
    });

    await waitFor(() => {
      expect(response.data?.addExpense).toEqual(mockExpense);
    });
  });

  it('支払い追加エラーを処理する', async () => {
    const errorMock = {
      request: {
        query: ADD_EXPENSE,
        variables: { input: mockAddExpenseInput },
      },
      error: new Error('支払いの追加に失敗しました'),
    };

    const { result } = renderHook(() => useAddExpense(), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={[errorMock]} addTypename={false}>
          {children}
        </MockedProvider>
      ),
    });

    const [addExpense] = result.current;

    await act(async () => {
      await expect(
        addExpense({
          variables: { input: mockAddExpenseInput },
        }),
      ).rejects.toThrow('支払いの追加に失敗しました');
    });
  });

  it('ローディング状態を正しく返す', () => {
    const { result } = renderHook(() => useAddExpense(), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={[]} addTypename={false}>
          {children}
        </MockedProvider>
      ),
    });

    const [, { loading, error }] = result.current;

    expect(loading).toBe(false);
    expect(error).toBeUndefined();
  });
});

describe('useGroupExpenses', () => {
  it('グループの支払い一覧を正常に取得する', async () => {
    const getGroupExpensesMock = {
      request: {
        query: GET_GROUP_EXPENSES,
        variables: { groupId: 'group-123' },
      },
      result: {
        data: { groupExpenses: mockExpenses },
      },
    };

    const { result } = renderHook(() => useGroupExpenses('group-123'), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={[getGroupExpensesMock]} addTypename={false}>
          {children}
        </MockedProvider>
      ),
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data?.groupExpenses).toEqual(mockExpenses);
    });
  });

  it('groupIdが空の場合クエリをスキップする', () => {
    const { result } = renderHook(() => useGroupExpenses(''), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={[]} addTypename={false}>
          {children}
        </MockedProvider>
      ),
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('支払い取得エラーを処理する', async () => {
    const errorMock = {
      request: {
        query: GET_GROUP_EXPENSES,
        variables: { groupId: 'group-123' },
      },
      error: new Error('支払い履歴の取得に失敗しました'),
    };

    const { result } = renderHook(() => useGroupExpenses('group-123'), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={[errorMock]} addTypename={false}>
          {children}
        </MockedProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeDefined();
    });
  });

  it('初期状態で空のデータを返す', async () => {
    const getGroupExpensesMock = {
      request: {
        query: GET_GROUP_EXPENSES,
        variables: { groupId: 'group-123' },
      },
      result: {
        data: { groupExpenses: [] },
      },
    };

    const { result } = renderHook(() => useGroupExpenses('group-123'), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={[getGroupExpensesMock]} addTypename={false}>
          {children}
        </MockedProvider>
      ),
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data?.groupExpenses).toEqual([]);
    });
  });

  it('複数の支払いを正しく処理する', async () => {
    const getGroupExpensesMock = {
      request: {
        query: GET_GROUP_EXPENSES,
        variables: { groupId: 'group-123' },
      },
      result: {
        data: { groupExpenses: mockExpenses },
      },
    };

    const { result } = renderHook(() => useGroupExpenses('group-123'), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={[getGroupExpensesMock]} addTypename={false}>
          {children}
        </MockedProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.data?.groupExpenses).toHaveLength(2);
      expect(result.current.data?.groupExpenses?.[0]).toEqual(mockExpenses[0]);
      expect(result.current.data?.groupExpenses?.[1]).toEqual(mockExpenses[1]);
    });
  });
});

describe('useDeleteExpense', () => {
  it('支払いを正常に削除する', async () => {
    const deleteExpenseMock = {
      request: {
        query: DELETE_EXPENSE,
        variables: { expenseId: 'expense-123' },
      },
      result: {
        data: { deleteExpense: true },
      },
    };

    const { result } = renderHook(() => useDeleteExpense(), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={[deleteExpenseMock]} addTypename={false}>
          {children}
        </MockedProvider>
      ),
    });

    const [deleteExpense] = result.current;

    let response: Awaited<ReturnType<typeof deleteExpense>>;
    await act(async () => {
      response = await deleteExpense({
        variables: { expenseId: 'expense-123' },
      });
    });

    await waitFor(() => {
      expect(response.data?.deleteExpense).toBe(true);
    });
  });

  it('支払い削除エラーを処理する', async () => {
    const errorMock = {
      request: {
        query: DELETE_EXPENSE,
        variables: { expenseId: 'expense-123' },
      },
      error: new Error('支払いの削除に失敗しました'),
    };

    const { result } = renderHook(() => useDeleteExpense(), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={[errorMock]} addTypename={false}>
          {children}
        </MockedProvider>
      ),
    });

    const [deleteExpense] = result.current;

    await act(async () => {
      await expect(
        deleteExpense({
          variables: { expenseId: 'expense-123' },
        }),
      ).rejects.toThrow('支払いの削除に失敗しました');
    });
  });

  it('ローディング状態を正しく返す', () => {
    const { result } = renderHook(() => useDeleteExpense(), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={[]} addTypename={false}>
          {children}
        </MockedProvider>
      ),
    });

    const [, { loading, error }] = result.current;

    expect(loading).toBe(false);
    expect(error).toBeUndefined();
  });

  it('falseレスポンスでの削除成功を処理する', async () => {
    const deleteExpenseMock = {
      request: {
        query: DELETE_EXPENSE,
        variables: { expenseId: 'nonexistent-expense' },
      },
      result: {
        data: { deleteExpense: false },
      },
    };

    const { result } = renderHook(() => useDeleteExpense(), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={[deleteExpenseMock]} addTypename={false}>
          {children}
        </MockedProvider>
      ),
    });

    const [deleteExpense] = result.current;

    let response: Awaited<ReturnType<typeof deleteExpense>>;
    await act(async () => {
      response = await deleteExpense({
        variables: { expenseId: 'nonexistent-expense' },
      });
    });

    await waitFor(() => {
      expect(response.data?.deleteExpense).toBe(false);
    });
  });
});
