import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MonthlyBarChart from './MonthlyBarChart';

// Rechartsのモック
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

describe('MonthlyBarChart', () => {
  const mockData = [
    { month: '2025-01', amount: 10000, count: 5 },
    { month: '2025-02', amount: 15000, count: 7 },
    { month: '2025-03', amount: 12000, count: 6 },
  ];

  it('should render the chart title', () => {
    render(<MonthlyBarChart data={mockData} />);

    expect(screen.getByText('月別支払い推移')).toBeInTheDocument();
  });

  it('should render bar chart components', () => {
    render(<MonthlyBarChart data={mockData} />);

    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
  });

  it('should show empty message when no data', () => {
    render(<MonthlyBarChart data={[]} />);

    expect(screen.getByText('支払いデータがありません')).toBeInTheDocument();
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
  });

  it('should handle custom currency', () => {
    render(<MonthlyBarChart data={mockData} currency="USD" />);

    expect(screen.getByText('月別支払い推移')).toBeInTheDocument();
  });
});
