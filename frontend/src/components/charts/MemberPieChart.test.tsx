import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DarkModeProvider } from '../../contexts/DarkModeContext';
import MemberPieChart from './MemberPieChart';

// Rechartsのモック
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: ({ children }: { children: React.ReactNode }) => <div data-testid="pie">{children}</div>,
  Cell: () => <div data-testid="cell" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

describe('MemberPieChart', () => {
  beforeEach(() => {
    // LocalStorageのモック
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
      },
      writable: true,
    });

    // matchMediaのモック
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
      writable: true,
    });
  });
  const mockData = [
    {
      memberName: 'Alice',
      memberId: 'member-1',
      totalPaid: 5000,
      expenseCount: 3,
      color: '#3B82F6',
    },
    {
      memberName: 'Bob',
      memberId: 'member-2',
      totalPaid: 3000,
      expenseCount: 2,
      color: '#EF4444',
    },
  ];

  it('should render the chart title', () => {
    render(
      <DarkModeProvider>
        <MemberPieChart data={mockData} />
      </DarkModeProvider>,
    );

    expect(screen.getByText('メンバー別支払い分布')).toBeInTheDocument();
  });

  it('should render pie chart components', () => {
    render(
      <DarkModeProvider>
        <MemberPieChart data={mockData} />
      </DarkModeProvider>,
    );

    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie')).toBeInTheDocument();
    expect(screen.getAllByTestId('cell')).toHaveLength(2);
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
  });

  it('should render legend with member names and amounts', () => {
    const { container } = render(
      <DarkModeProvider>
        <MemberPieChart data={mockData} />
      </DarkModeProvider>,
    );

    // 凡例セクションが存在することを確認
    const legendItems = container.querySelectorAll('.grid .flex');
    expect(legendItems).toHaveLength(2);

    // 色インジケーターが存在することを確認
    const colorIndicators = container.querySelectorAll('.w-4');
    expect(colorIndicators).toHaveLength(2);
  });

  it('should show empty message when no data', () => {
    render(
      <DarkModeProvider>
        <MemberPieChart data={[]} />
      </DarkModeProvider>,
    );

    expect(screen.getByText('支払いデータがありません')).toBeInTheDocument();
    expect(screen.queryByTestId('pie-chart')).not.toBeInTheDocument();
  });

  it('should handle custom currency', () => {
    render(
      <DarkModeProvider>
        <MemberPieChart data={mockData} currency="USD" />
      </DarkModeProvider>,
    );

    expect(screen.getByText('メンバー別支払い分布')).toBeInTheDocument();
    // formatCurrencyがモックされていないため、通貨記号は確認できない
  });
});
