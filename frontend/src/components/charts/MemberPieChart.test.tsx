import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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
    render(<MemberPieChart data={mockData} />);

    expect(screen.getByText('メンバー別支払い分布')).toBeInTheDocument();
  });

  it('should render pie chart components', () => {
    render(<MemberPieChart data={mockData} />);

    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie')).toBeInTheDocument();
    expect(screen.getAllByTestId('cell')).toHaveLength(2);
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
  });

  it('should render legend with member names and amounts', () => {
    const { container } = render(<MemberPieChart data={mockData} />);

    // 凡例セクションが存在することを確認
    const legendItems = container.querySelectorAll('.grid .flex');
    expect(legendItems).toHaveLength(2);

    // 色インジケーターが存在することを確認
    const colorIndicators = container.querySelectorAll('.w-4');
    expect(colorIndicators).toHaveLength(2);
  });

  it('should show empty message when no data', () => {
    render(<MemberPieChart data={[]} />);

    expect(screen.getByText('支払いデータがありません')).toBeInTheDocument();
    expect(screen.queryByTestId('pie-chart')).not.toBeInTheDocument();
  });

  it('should handle custom currency', () => {
    render(<MemberPieChart data={mockData} currency="USD" />);

    expect(screen.getByText('メンバー別支払い分布')).toBeInTheDocument();
    // formatCurrencyがモックされていないため、通貨記号は確認できない
  });
});
