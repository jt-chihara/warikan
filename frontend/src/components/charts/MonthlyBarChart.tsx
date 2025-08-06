import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useDarkMode } from '../../contexts/DarkModeContext';
import type { MonthlyExpenseData } from '../../utils/chartUtils';
import { formatCurrency } from '../../utils/chartUtils';

interface MonthlyBarChartProps {
  data: MonthlyExpenseData[];
  currency?: string;
}

export default function MonthlyBarChart({ data, currency = 'JPY' }: MonthlyBarChartProps) {
  const { isDarkMode } = useDarkMode();
  if (data.length === 0) {
    return (
      <div className="w-full h-80 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">支払いデータがありません</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        月別支払い推移
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
            <XAxis
              dataKey="month"
              tickFormatter={(value) => {
                const [year, month] = value.split('-');
                return `${year}/${month}`;
              }}
            />
            <YAxis tickFormatter={(value) => formatCurrency(value, currency)} />
            <Tooltip
              labelFormatter={(value) => {
                const [year, month] = (value as string).split('-');
                return `${year}年${month}月`;
              }}
              formatter={(value: number, name: string) => [
                name === 'amount' ? formatCurrency(value, currency) : `${value}件`,
                name === 'amount' ? '支払い額' : '件数',
              ]}
              contentStyle={{
                backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                borderRadius: '0.375rem',
              }}
              labelStyle={{
                color: isDarkMode ? '#d1d5db' : '#374151',
              }}
              itemStyle={{
                color: isDarkMode ? '#f3f4f6' : '#111827',
              }}
            />
            <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
