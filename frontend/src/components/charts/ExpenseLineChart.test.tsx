import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ExpenseLineChart from './ExpenseLineChart';

// Rechartsのモック
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

describe('ExpenseLineChart', () => {
  const mockData = [
    { date: '2025-01-20', amount: 1000, count: 1 },
    { date: '2025-01-21', amount: 2000, count: 2 },
    { date: '2025-01-22', amount: 1500, count: 1 },
  ];

  it('should render the chart title', () => {
    render(<ExpenseLineChart data={mockData} />);

    expect(screen.getByText('過去30日の支払い推移')).toBeInTheDocument();
  });

  it('should render line chart components', () => {
    render(<ExpenseLineChart data={mockData} />);

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('line')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
  });

  it('should render with custom currency', () => {
    render(<ExpenseLineChart data={mockData} currency="USD" />);

    expect(screen.getByText('過去30日の支払い推移')).toBeInTheDocument();
  });

  it('should handle empty data', () => {
    render(<ExpenseLineChart data={[]} />);

    expect(screen.getByText('過去30日の支払い推移')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });
});
