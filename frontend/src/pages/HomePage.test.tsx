import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Group } from '../types/group';
import HomePage from './HomePage';

// Mock the useLocalGroups hook
vi.mock('../hooks/useLocalGroups', () => ({
  useLocalGroups: vi.fn(),
}));

import { useLocalGroups } from '../hooks/useLocalGroups';

const mockGroups: Group[] = [
  {
    id: 'group-1',
    name: 'グループ1',
    description: '説明1',
    currency: 'JPY',
    createdAt: '2024-01-01',
    members: [
      { id: 'member-1', name: 'Alice', joinedAt: '2024-01-01' },
      { id: 'member-2', name: 'Bob', joinedAt: '2024-01-01' },
    ],
  },
  {
    id: 'group-2',
    name: 'グループ2',
    currency: 'JPY',
    createdAt: '2024-01-02',
    members: [{ id: 'member-3', name: 'Carol', joinedAt: '2024-01-02' }],
  },
];

describe('HomePage', () => {
  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders hero section', () => {
    vi.mocked(useLocalGroups).mockReturnValue({
      groups: [],
      addGroup: vi.fn(),
      updateGroup: vi.fn(),
      removeGroup: vi.fn(),
    });

    renderWithRouter(<HomePage />);

    expect(screen.getByText('簡単に割り勘計算')).toBeInTheDocument();
    expect(
      screen.getByText('旅行や飲み会の支払いを記録して、最適な精算方法を計算します'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'グループを作成する' })).toBeInTheDocument();
  });

  it('renders feature cards', () => {
    vi.mocked(useLocalGroups).mockReturnValue({
      groups: [],
      addGroup: vi.fn(),
      updateGroup: vi.fn(),
      removeGroup: vi.fn(),
    });

    renderWithRouter(<HomePage />);

    expect(screen.getByText('会員登録不要')).toBeInTheDocument();
    expect(screen.getByText('最適な精算方法')).toBeInTheDocument();
    expect(screen.getByText('柔軟な計算')).toBeInTheDocument();
  });

  it('does not show recent groups when no groups exist', () => {
    vi.mocked(useLocalGroups).mockReturnValue({
      groups: [],
      addGroup: vi.fn(),
      updateGroup: vi.fn(),
      removeGroup: vi.fn(),
    });

    renderWithRouter(<HomePage />);

    expect(screen.queryByText('最近のグループ')).not.toBeInTheDocument();
  });

  it('shows recent groups when groups exist', () => {
    vi.mocked(useLocalGroups).mockReturnValue({
      groups: mockGroups,
      addGroup: vi.fn(),
      updateGroup: vi.fn(),
      removeGroup: vi.fn(),
    });

    renderWithRouter(<HomePage />);

    expect(screen.getByText('最近のグループ')).toBeInTheDocument();
    expect(screen.getByText('グループ1')).toBeInTheDocument();
    expect(screen.getByText('グループ2')).toBeInTheDocument();
    expect(screen.getByText('説明1')).toBeInTheDocument();
  });

  it('shows member count for each group', () => {
    vi.mocked(useLocalGroups).mockReturnValue({
      groups: mockGroups,
      addGroup: vi.fn(),
      updateGroup: vi.fn(),
      removeGroup: vi.fn(),
    });

    renderWithRouter(<HomePage />);

    expect(screen.getByText('2人')).toBeInTheDocument();
    expect(screen.getByText('1人')).toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    vi.mocked(useLocalGroups).mockReturnValue({
      groups: mockGroups,
      addGroup: vi.fn(),
      updateGroup: vi.fn(),
      removeGroup: vi.fn(),
    });

    renderWithRouter(<HomePage />);

    const dates = screen.getAllByText(/2024\/1\/\d+/);
    expect(dates).toHaveLength(2);
  });

  it('links to group pages correctly', () => {
    vi.mocked(useLocalGroups).mockReturnValue({
      groups: mockGroups,
      addGroup: vi.fn(),
      updateGroup: vi.fn(),
      removeGroup: vi.fn(),
    });

    renderWithRouter(<HomePage />);

    const groupLinks = screen.getAllByRole('link', { name: /グループ\d/ });
    expect(groupLinks[0]).toHaveAttribute('href', '/groups/group-1');
    expect(groupLinks[1]).toHaveAttribute('href', '/groups/group-2');
  });

  it('shows only first 6 groups', () => {
    const manyGroups = Array.from({ length: 10 }, (_, i) => ({
      id: `group-${i + 1}`,
      name: `グループ${i + 1}`,
      currency: 'JPY',
      createdAt: '2024-01-01',
      members: [],
    }));

    vi.mocked(useLocalGroups).mockReturnValue({
      groups: manyGroups,
      addGroup: vi.fn(),
      updateGroup: vi.fn(),
      removeGroup: vi.fn(),
    });

    renderWithRouter(<HomePage />);

    const groupLinks = screen.getAllByRole('link', { name: /グループ\d+/ });
    expect(groupLinks).toHaveLength(6);
    expect(screen.getByText('すべてのグループを見る')).toBeInTheDocument();
  });
});
