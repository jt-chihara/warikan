import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DarkModeProvider } from '../../contexts/DarkModeContext';
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
    { date: '2025-01-20', amount: 1000, count: 1 },
    { date: '2025-01-21', amount: 2000, count: 2 },
    { date: '2025-01-22', amount: 1500, count: 1 },
  ];

  it('should render the chart title', () => {
    render(
      <DarkModeProvider>
        <ExpenseLineChart data={mockData} />
      </DarkModeProvider>,
    );

    expect(screen.getByText('過去30日の支払い推移')).toBeInTheDocument();
  });

  it('should render line chart components', () => {
    render(
      <DarkModeProvider>
        <ExpenseLineChart data={mockData} />
      </DarkModeProvider>,
    );

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('line')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
  });

  it('should render with custom currency', () => {
    render(
      <DarkModeProvider>
        <ExpenseLineChart data={mockData} currency="USD" />
      </DarkModeProvider>,
    );

    expect(screen.getByText('過去30日の支払い推移')).toBeInTheDocument();
  });

  it('should handle empty data', () => {
    render(
      <DarkModeProvider>
        <ExpenseLineChart data={[]} />
      </DarkModeProvider>,
    );

    expect(screen.getByText('過去30日の支払い推移')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });
});
