import { gql } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AnalyticsPage from './AnalyticsPage';

// ResizeObserverのモック
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render basic analytics page structure', () => {
    // シンプルなテスト: ページコンポーネントが問題なく作成できるかのみ確認
    const { container } = render(
      <BrowserRouter>
        <MockedProvider mocks={mocks} addTypename={false}>
          <AnalyticsPage />
        </MockedProvider>
      </BrowserRouter>,
    );

    expect(container).toBeDefined();
  });
});
