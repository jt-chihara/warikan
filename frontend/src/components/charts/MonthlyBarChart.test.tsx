import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DarkModeProvider } from '../../contexts/DarkModeContext';
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
    { month: '2025-01', amount: 10000, count: 5 },
    { month: '2025-02', amount: 15000, count: 7 },
    { month: '2025-03', amount: 12000, count: 6 },
  ];

  it('should render the chart title', () => {
    render(
      <DarkModeProvider>
        <MonthlyBarChart data={mockData} />
      </DarkModeProvider>,
    );

    expect(screen.getByText('月別支払い推移')).toBeInTheDocument();
  });

  it('should render bar chart components', () => {
    render(
      <DarkModeProvider>
        <MonthlyBarChart data={mockData} />
      </DarkModeProvider>,
    );

    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
  });

  it('should show empty message when no data', () => {
    render(
      <DarkModeProvider>
        <MonthlyBarChart data={[]} />
      </DarkModeProvider>,
    );

    expect(screen.getByText('支払いデータがありません')).toBeInTheDocument();
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
  });

  it('should handle custom currency', () => {
    render(
      <DarkModeProvider>
        <MonthlyBarChart data={mockData} currency="USD" />
      </DarkModeProvider>,
    );

    expect(screen.getByText('月別支払い推移')).toBeInTheDocument();
  });
});
