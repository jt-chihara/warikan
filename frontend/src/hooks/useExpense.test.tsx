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
  it('adds expense successfully', async () => {
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

  it('handles add expense errors', async () => {
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

  it('returns loading state correctly', () => {
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
  it('fetches group expenses successfully', async () => {
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

  it('skips query when groupId is empty', () => {
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

  it('handles fetch expenses errors', async () => {
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

  it('returns empty data initially', async () => {
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

  it('handles multiple expenses correctly', async () => {
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
  it('deletes expense successfully', async () => {
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

  it('handles delete expense errors', async () => {
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

  it('returns loading state correctly', () => {
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

  it('handles successful deletion with false response', async () => {
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
