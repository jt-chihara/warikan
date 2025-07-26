import { gql } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AnalyticsPage from './AnalyticsPage';

// モックデータ
const mockGroup = {
  id: 'group-123',
  name: 'テストグループ',
  description: 'テスト用のグループ',
  currency: 'JPY',
  createdAt: { seconds: 1753447425, nanos: 0 },
  updatedAt: { seconds: 1753447425, nanos: 0 },
  members: [
    {
      id: 'member-1',
      name: 'Alice',
      email: 'alice@example.com',
      joinedAt: { seconds: 1753447425, nanos: 0 },
    },
    {
      id: 'member-2',
      name: 'Bob',
      email: 'bob@example.com',
      joinedAt: { seconds: 1753447425, nanos: 0 },
    },
  ],
};

const mockExpenses = [
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
    createdAt: { seconds: 1753447425, nanos: 0 },
  },
  {
    id: 'expense-2',
    groupId: 'group-123',
    amount: 2000,
    description: 'ディナー',
    paidById: 'member-2',
    paidByName: 'Bob',
    splitMembers: [
      { memberId: 'member-1', memberName: 'Alice', amount: 1000 },
      { memberId: 'member-2', memberName: 'Bob', amount: 1000 },
    ],
    createdAt: { seconds: 1753447430, nanos: 0 },
  },
];

// GraphQLクエリの定義（実際のクエリに合わせる）
const GET_GROUP = gql`
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

// GraphQLクエリのモック
const mocks = [
  {
    request: {
      query: GET_GROUP,
      variables: { id: 'group-123' },
    },
    result: {
      data: { group: mockGroup },
    },
  },
  {
    request: {
      query: GET_GROUP_EXPENSES,
      variables: { groupId: 'group-123' },
    },
    result: {
      data: { groupExpenses: mockExpenses },
    },
  },
];

// React Routerのパラメータをモック
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ groupId: 'group-123' }),
  };
});

describe('AnalyticsPage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    render(
      <BrowserRouter>
        <MockedProvider mocks={mocks} addTypename={false}>
          <AnalyticsPage />
        </MockedProvider>
      </BrowserRouter>,
    );

    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('should render analytics page with tabs', async () => {
    render(
      <BrowserRouter>
        <MockedProvider mocks={mocks} addTypename={false}>
          <AnalyticsPage />
        </MockedProvider>
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('📊 データ分析')).toBeInTheDocument();
    });

    // タブが表示されることを確認
    expect(screen.getByRole('tab', { name: '日別推移を表示' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '月別推移を表示' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'メンバー別を表示' })).toBeInTheDocument();
  });

  it('should switch tabs when clicked', async () => {
    render(
      <BrowserRouter>
        <MockedProvider mocks={mocks} addTypename={false}>
          <AnalyticsPage />
        </MockedProvider>
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('📊 データ分析')).toBeInTheDocument();
    });

    // 月別推移タブをクリック
    const monthlyTab = screen.getByRole('tab', { name: '月別推移を表示' });
    await user.click(monthlyTab);

    expect(monthlyTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('月別支払い推移')).toBeInTheDocument();

    // メンバー別タブをクリック
    const memberTab = screen.getByRole('tab', { name: 'メンバー別を表示' });
    await user.click(memberTab);

    expect(memberTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('メンバー別支払い分布')).toBeInTheDocument();
  });

  it('should support keyboard navigation', async () => {
    render(
      <BrowserRouter>
        <MockedProvider mocks={mocks} addTypename={false}>
          <AnalyticsPage />
        </MockedProvider>
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('📊 データ分析')).toBeInTheDocument();
    });

    const dailyTab = screen.getByRole('tab', { name: '日別推移を表示' });
    dailyTab.focus();

    // 右矢印キーで次のタブへ
    fireEvent.keyDown(dailyTab, { key: 'ArrowRight' });

    await waitFor(() => {
      const monthlyTab = screen.getByRole('tab', { name: '月別推移を表示' });
      expect(monthlyTab).toHaveAttribute('aria-selected', 'true');
    });

    // Homeキーで最初のタブへ
    const monthlyTab = screen.getByRole('tab', { name: '月別推移を表示' });
    fireEvent.keyDown(monthlyTab, { key: 'Home' });

    await waitFor(() => {
      expect(dailyTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  it('should render group statistics', async () => {
    render(
      <BrowserRouter>
        <MockedProvider mocks={mocks} addTypename={false}>
          <AnalyticsPage />
        </MockedProvider>
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('📊 データ分析')).toBeInTheDocument();
    });

    // グラフが表示されることを確認
    expect(screen.getByText('過去30日の支払い推移')).toBeInTheDocument();
  });

  it('should handle empty expenses', async () => {
    const emptyMocks = [
      {
        request: {
          query: GET_GROUP,
          variables: { id: 'group-123' },
        },
        result: {
          data: { group: mockGroup },
        },
      },
      {
        request: {
          query: GET_GROUP_EXPENSES,
          variables: { groupId: 'group-123' },
        },
        result: {
          data: { groupExpenses: [] },
        },
      },
    ];

    render(
      <BrowserRouter>
        <MockedProvider mocks={emptyMocks} addTypename={false}>
          <AnalyticsPage />
        </MockedProvider>
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('📊 データ分析')).toBeInTheDocument();
    });

    // 日別推移タブをクリックしても空のメッセージが表示される
    const dailyTab = screen.getByRole('tab', { name: '日別推移を表示' });
    await user.click(dailyTab);

    expect(screen.getByText('過去30日の支払い推移')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', async () => {
    render(
      <BrowserRouter>
        <MockedProvider mocks={mocks} addTypename={false}>
          <AnalyticsPage />
        </MockedProvider>
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('📊 データ分析')).toBeInTheDocument();
    });

    // タブリストのアクセシビリティ属性を確認
    const tablist = screen.getByRole('tablist');
    expect(tablist).toHaveAttribute('aria-label', 'グラフタブ');

    // タブパネルのアクセシビリティ属性を確認
    const tabpanel = screen.getByRole('tabpanel');
    expect(tabpanel).toHaveAttribute('aria-labelledby', 'daily-tab');

    // 各タブのアクセシビリティ属性を確認
    const dailyTab = screen.getByRole('tab', { name: '日別推移を表示' });
    expect(dailyTab).toHaveAttribute('id', 'daily-tab');
    expect(dailyTab).toHaveAttribute('aria-selected', 'true');
    expect(dailyTab).toHaveAttribute('tabIndex', '0');

    const monthlyTab = screen.getByRole('tab', { name: '月別推移を表示' });
    expect(monthlyTab).toHaveAttribute('aria-selected', 'false');
    expect(monthlyTab).toHaveAttribute('tabIndex', '-1');
  });
});
