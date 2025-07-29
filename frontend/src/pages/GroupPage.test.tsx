import { gql } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { Expense, ExpenseInput, Group, SettlementResult } from '../types/group';
import GroupPage from './GroupPage';

// React Router useParamsをモック
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ groupId: 'group-123' }),
  };
});

const mockGroup: Group = {
  id: 'group-123',
  name: 'テストグループ',
  description: 'テスト用のグループです',
  currency: 'JPY',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  members: [
    { id: 'member-1', name: 'Alice', email: 'alice@example.com', joinedAt: '2024-01-01T00:00:00Z' },
    { id: 'member-2', name: 'Bob', email: 'bob@example.com', joinedAt: '2024-01-01T00:00:00Z' },
  ],
};

const mockExpenses: Expense[] = [
  {
    id: 'expense-1',
    groupId: 'group-123',
    amount: 1000,
    description: 'ランチ',
    paidById: 'member-1',
    paidByName: 'Alice',
    splitMembers: [
      { memberId: 'member-1', memberName: 'Alice', amount: 500 },
      { memberId: 'member-2', memberName: 'Bob', amount: 500 },
    ],
    createdAt: '2024-01-01T12:00:00Z',
  },
];

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

const GET_GROUP_EXPENSES_QUERY = gql`
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

const DELETE_EXPENSE = gql`
  mutation DeleteExpense($expenseId: ID!) {
    deleteExpense(expenseId: $expenseId)
  }
`;

const mocks = [
  {
    request: {
      query: GET_GROUP_QUERY,
      variables: { id: 'group-123' },
    },
    result: {
      data: { group: mockGroup },
    },
  },
  {
    request: {
      query: GET_GROUP_EXPENSES_QUERY,
      variables: { groupId: 'group-123' },
    },
    result: {
      data: { groupExpenses: mockExpenses },
    },
  },
  {
    request: {
      query: CALCULATE_SETTLEMENTS_QUERY,
      variables: {
        groupId: 'group-123',
        expenses: [
          {
            id: 'expense-1',
            payerId: 'member-1',
            amount: 1000,
            splitBetween: ['member-1', 'member-2'],
          },
        ] as ExpenseInput[],
      },
    },
    result: {
      data: { calculateSettlements: mockSettlementResult },
    },
  },
];

const renderGroupPage = () => {
  return render(
    <BrowserRouter>
      <MockedProvider mocks={mocks} addTypename={false}>
        <GroupPage />
      </MockedProvider>
    </BrowserRouter>,
  );
};

describe('GroupPage', () => {
  it('renders group information correctly', async () => {
    renderGroupPage();

    await waitFor(() => {
      expect(screen.getByText('テストグループ')).toBeInTheDocument();
      expect(screen.getByText('テスト用のグループです')).toBeInTheDocument();
      expect(screen.getByText('通貨: JPY')).toBeInTheDocument();
      // レスポンシブレイアウトで複数の「2人」表示があるため、最初の要素をチェック
      expect(screen.getAllByText('2人')[0]).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  it('shows expenses in the expenses tab', async () => {
    renderGroupPage();

    await waitFor(() => {
      expect(screen.getByText('ランチ')).toBeInTheDocument();
      expect(screen.getByText('Aliceが支払い')).toBeInTheDocument();
      expect(screen.getByText('¥1,000')).toBeInTheDocument();
      expect(screen.getByText('2人で割り勘')).toBeInTheDocument();
    });
  });

  it('switches to settlement tab and shows settlements', async () => {
    const user = userEvent.setup();
    renderGroupPage();

    // まずデータが読み込まれるまで待つ
    await waitFor(() => {
      expect(screen.getByText('テストグループ')).toBeInTheDocument();
    });

    // 精算タブをクリック
    await user.click(screen.getByText('精算'));

    await waitFor(() => {
      expect(screen.getByText('精算方法')).toBeInTheDocument();
      expect(screen.getByText('最小の支払い回数で精算できる方法です')).toBeInTheDocument();
    });

    // 精算結果が表示されるまで待つ
    await waitFor(() => {
      expect(screen.getByText('Bob → Alice')).toBeInTheDocument();
      expect(screen.getByText('¥500')).toBeInTheDocument();
    });
  });

  it('shows member balances in settlement tab', async () => {
    const user = userEvent.setup();
    renderGroupPage();

    // まずデータが読み込まれるまで待つ
    await waitFor(() => {
      expect(screen.getByText('テストグループ')).toBeInTheDocument();
    });

    // 精算タブをクリック
    await user.click(screen.getByText('精算'));

    await waitFor(() => {
      expect(screen.getByText('各メンバーの収支')).toBeInTheDocument();
      expect(screen.getByText('+¥500')).toBeInTheDocument(); // Aliceの収支
      expect(screen.getByText('¥-500')).toBeInTheDocument(); // Bobの収支
    });
  });

  it('opens expense modal when add expense button is clicked', async () => {
    const user = userEvent.setup();
    renderGroupPage();

    await waitFor(() => {
      expect(screen.getByText('支払いを追加')).toBeInTheDocument();
    });

    await user.click(screen.getByText('支払いを追加'));

    // ExpenseModalが開かれることを確認
    // 注意: ExpenseModalの内容はExpenseModal.test.tsxでテストされる
  });

  it('shows loading state', () => {
    const loadingMocks = [
      {
        request: {
          query: GET_GROUP_QUERY,
          variables: { id: 'group-123' },
        },
        delay: 1000, // 遅延を設定してローディング状態をテスト
        result: {
          data: { group: mockGroup },
        },
      },
      {
        request: {
          query: GET_GROUP_EXPENSES_QUERY,
          variables: { groupId: 'group-123' },
        },
        delay: 1000,
        result: {
          data: { groupExpenses: mockExpenses },
        },
      },
    ];

    render(
      <BrowserRouter>
        <MockedProvider mocks={loadingMocks} addTypename={false}>
          <GroupPage />
        </MockedProvider>
      </BrowserRouter>,
    );

    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('shows error state', async () => {
    const errorMocks = [
      {
        request: {
          query: GET_GROUP_QUERY,
          variables: { id: 'group-123' },
        },
        error: new Error('グループが見つかりません'),
      },
      {
        request: {
          query: GET_GROUP_EXPENSES_QUERY,
          variables: { groupId: 'group-123' },
        },
        result: {
          data: { groupExpenses: [] },
        },
      },
    ];

    render(
      <BrowserRouter>
        <MockedProvider mocks={errorMocks} addTypename={false}>
          <GroupPage />
        </MockedProvider>
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/エラーが発生しました/)).toBeInTheDocument();
    });
  });

  it('deletes expense when delete button is clicked', async () => {
    const user = userEvent.setup();

    // Mock for successful deletion
    const deleteExpenseMock = {
      request: {
        query: DELETE_EXPENSE,
        variables: { expenseId: 'expense-1' },
      },
      result: {
        data: { deleteExpense: true },
      },
    };

    // Mock for refetch after deletion
    const refetchExpensesMock = {
      request: {
        query: GET_GROUP_EXPENSES_QUERY,
        variables: { groupId: 'group-123' },
      },
      result: {
        data: { groupExpenses: [] }, // Empty after deletion
      },
    };

    const mocksWithDelete = [...mocks, deleteExpenseMock, refetchExpensesMock];

    render(
      <BrowserRouter>
        <MockedProvider mocks={mocksWithDelete} addTypename={false}>
          <GroupPage />
        </MockedProvider>
      </BrowserRouter>,
    );

    // Wait for the page to load and expense to appear
    await waitFor(() => {
      expect(screen.getByText('ランチ')).toBeInTheDocument();
    });

    // Mock window.confirm to return true
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    // Click the delete button
    const deleteButton = screen.getByRole('button', { name: /削除/ });
    await user.click(deleteButton);

    // Verify confirm was called
    expect(window.confirm).toHaveBeenCalledWith('この支払い記録を削除してもよろしいですか？');

    // Wait for the expense to be removed
    await waitFor(() => {
      expect(screen.queryByText('ランチ')).not.toBeInTheDocument();
    });

    // Restore the mock
    vi.restoreAllMocks();
  });

  it('does not delete expense when user cancels confirmation', async () => {
    const user = userEvent.setup();

    renderGroupPage();

    // Wait for the page to load and expense to appear
    await waitFor(() => {
      expect(screen.getByText('ランチ')).toBeInTheDocument();
    });

    // Mock window.confirm to return false (user cancels)
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    // Click the delete button
    const deleteButton = screen.getByRole('button', { name: /削除/ });
    await user.click(deleteButton);

    // Verify confirm was called
    expect(window.confirm).toHaveBeenCalledWith('この支払い記録を削除してもよろしいですか？');

    // Expense should still be there since deletion was cancelled
    expect(screen.getByText('ランチ')).toBeInTheDocument();

    // Restore the mock
    vi.restoreAllMocks();
  });

  it('shows error alert when expense deletion fails', async () => {
    const user = userEvent.setup();

    // Mock for failed deletion
    const deleteExpenseErrorMock = {
      request: {
        query: DELETE_EXPENSE,
        variables: { expenseId: 'expense-1' },
      },
      error: new Error('支払いの削除に失敗しました'),
    };

    const mocksWithDeleteError = [...mocks, deleteExpenseErrorMock];

    render(
      <BrowserRouter>
        <MockedProvider mocks={mocksWithDeleteError} addTypename={false}>
          <GroupPage />
        </MockedProvider>
      </BrowserRouter>,
    );

    // Wait for the page to load and expense to appear
    await waitFor(() => {
      expect(screen.getByText('ランチ')).toBeInTheDocument();
    });

    // Mock window.confirm to return true and window.alert
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    // Click the delete button
    const deleteButton = screen.getByRole('button', { name: /削除/ });
    await user.click(deleteButton);

    // Wait for error handling
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('支払いの削除に失敗しました。');
    });

    // Expense should still be there since deletion failed
    expect(screen.getByText('ランチ')).toBeInTheDocument();

    // Restore the mocks
    vi.restoreAllMocks();
  });
});
