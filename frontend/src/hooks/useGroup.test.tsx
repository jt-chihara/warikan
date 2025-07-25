import { gql } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CreateGroupInput, ExpenseInput, Group, SettlementResult } from '../types/group';
import { useCalculateSettlements, useCreateGroup, useGroup } from './useGroup';

const mockGroup: Group = {
  id: 'group-123',
  name: 'テストグループ',
  description: 'テスト用のグループです',
  currency: 'JPY',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  members: [
    { id: 'member-1', name: 'Alice', email: 'alice@example.com', joinedAt: '2024-01-01' },
    { id: 'member-2', name: 'Bob', email: 'bob@example.com', joinedAt: '2024-01-01' },
  ],
};

const mockCreateGroupInput: CreateGroupInput = {
  name: 'テストグループ',
  description: 'テスト用のグループです',
  currency: 'JPY',
  memberNames: ['Alice', 'Bob'],
};

const mockSettlementResult: SettlementResult = {
  settlements: [
    {
      fromMemberId: 'member-2',
      toMemberId: 'member-1',
      amount: 500,
      fromName: 'Bob',
      toName: 'Alice',
    },
  ],
  balances: [
    { memberId: 'member-1', memberName: 'Alice', balance: 500 },
    { memberId: 'member-2', memberName: 'Bob', balance: -500 },
  ],
};

const CREATE_GROUP_MUTATION = gql`
  mutation CreateGroup($input: CreateGroupInput!) {
    createGroup(input: $input) {
      id
      name
      description
      currency
      createdAt
      members {
        id
        name
        email
        joinedAt
      }
    }
  }
`;

const GET_GROUP_QUERY = gql`
  query GetGroup($id: ID!) {
    group(id: $id) {
      id
      name
      description
      currency
      createdAt
      updatedAt
      members {
        id
        name
        email
        joinedAt
      }
    }
  }
`;

const CALCULATE_SETTLEMENTS_QUERY = gql`
  query CalculateSettlements($groupId: ID!, $expenses: [ExpenseInput!]!) {
    calculateSettlements(groupId: $groupId, expenses: $expenses) {
      settlements {
        fromMemberId
        toMemberId
        amount
        fromName
        toName
      }
      balances {
        memberId
        memberName
        balance
      }
    }
  }
`;

describe('useCreateGroup', () => {
  it('creates a group successfully', async () => {
    const createGroupMock = {
      request: {
        query: CREATE_GROUP_MUTATION,
        variables: { input: mockCreateGroupInput },
      },
      result: {
        data: { createGroup: mockGroup },
      },
    };

    const { result } = renderHook(() => useCreateGroup(), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={[createGroupMock]} addTypename={false}>
          {children}
        </MockedProvider>
      ),
    });

    const [createGroup] = result.current;

    let response: Awaited<ReturnType<typeof createGroup>>;
    await act(async () => {
      response = await createGroup({
        variables: { input: mockCreateGroupInput },
      });
    });

    await waitFor(() => {
      expect(response.data?.createGroup).toEqual(mockGroup);
    });
  });

  it('handles create group errors', async () => {
    const errorMock = {
      request: {
        query: CREATE_GROUP_MUTATION,
        variables: { input: mockCreateGroupInput },
      },
      error: new Error('グループの作成に失敗しました'),
    };

    const { result } = renderHook(() => useCreateGroup(), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={[errorMock]} addTypename={false}>
          {children}
        </MockedProvider>
      ),
    });

    const [createGroup] = result.current;

    await act(async () => {
      await expect(
        createGroup({
          variables: { input: mockCreateGroupInput },
        }),
      ).rejects.toThrow('グループの作成に失敗しました');
    });
  });
});

describe('useGroup', () => {
  it('fetches group data successfully', async () => {
    const getGroupMock = {
      request: {
        query: GET_GROUP_QUERY,
        variables: { id: 'group-123' },
      },
      result: {
        data: { group: mockGroup },
      },
    };

    const { result } = renderHook(() => useGroup('group-123'), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={[getGroupMock]} addTypename={false}>
          {children}
        </MockedProvider>
      ),
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data?.group).toEqual(mockGroup);
    });
  });

  it('skips query when id is empty', () => {
    const { result } = renderHook(() => useGroup(''), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={[]} addTypename={false}>
          {children}
        </MockedProvider>
      ),
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('handles fetch group errors', async () => {
    const errorMock = {
      request: {
        query: GET_GROUP_QUERY,
        variables: { id: 'group-123' },
      },
      error: new Error('グループが見つかりません'),
    };

    const { result } = renderHook(() => useGroup('group-123'), {
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
});

describe('useCalculateSettlements', () => {
  it('calculates settlements successfully', async () => {
    const mockExpenses: ExpenseInput[] = [
      {
        id: 'expense-1',
        payerId: 'member-1',
        amount: 1000,
        splitBetween: ['member-1', 'member-2'],
      },
    ];

    const calculateSettlementsMock = {
      request: {
        query: CALCULATE_SETTLEMENTS_QUERY,
        variables: {
          groupId: 'group-123',
          expenses: mockExpenses,
        },
      },
      result: {
        data: { calculateSettlements: mockSettlementResult },
      },
    };

    const { result } = renderHook(() => useCalculateSettlements(), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={[calculateSettlementsMock]} addTypename={false}>
          {children}
        </MockedProvider>
      ),
    });

    // 初期状態ではskipされているため、手動でrefetchを呼ぶ
    expect(result.current.loading).toBe(false);
    expect(result.current.called).toBe(false);

    let refetchResult: Awaited<ReturnType<typeof result.current.refetch>> | undefined;
    await act(async () => {
      refetchResult = await result.current.refetch({
        groupId: 'group-123',
        expenses: mockExpenses,
      });
    });

    expect(refetchResult?.data.calculateSettlements).toEqual(mockSettlementResult);
  });

  it('is initially skipped', () => {
    const { result } = renderHook(() => useCalculateSettlements(), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={[]} addTypename={false}>
          {children}
        </MockedProvider>
      ),
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.called).toBe(false);
    expect(result.current.data).toBeUndefined();
  });
});
