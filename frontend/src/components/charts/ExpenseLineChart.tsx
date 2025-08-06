import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useDarkMode } from '../../contexts/DarkModeContext';
import type { DailyExpenseData } from '../../utils/chartUtils';
import { formatCurrency } from '../../utils/chartUtils';

interface ExpenseLineChartProps {
  data: DailyExpenseData[];
  currency?: string;
}

export default function ExpenseLineChart({ data, currency = 'JPY' }: ExpenseLineChartProps) {
  const { isDarkMode } = useDarkMode();
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        過去30日の支払い推移
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 40 }}>
            <XAxis
              dataKey="date"
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
              interval="preserveStartEnd"
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis tickFormatter={(value) => formatCurrency(value, currency)} />
            <Tooltip
              labelFormatter={(value) => {
                const date = new Date(value as string);
                return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
              }}
              formatter={(value: number, name: string) => [
                formatCurrency(value, currency),
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
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
