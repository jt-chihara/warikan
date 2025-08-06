import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useDarkMode } from '../../contexts/DarkModeContext';
import type { MemberExpenseData } from '../../utils/chartUtils';
import { formatCurrency } from '../../utils/chartUtils';

interface MemberPieChartProps {
  data: MemberExpenseData[];
  currency?: string;
}

export default function MemberPieChart({ data, currency = 'JPY' }: MemberPieChartProps) {
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
        メンバー別支払い分布
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ memberName, percent }) =>
                `${memberName}: ${((percent || 0) * 100).toFixed(1)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="totalPaid"
              stroke={isDarkMode ? '#374151' : '#e5e7eb'}
              strokeWidth={1}
            >
              {data.map((entry) => (
                <Cell
                  key={`cell-${entry.memberId}`}
                  fill={entry.color}
                  stroke={isDarkMode ? '#374151' : '#e5e7eb'}
                  strokeWidth={1}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, _name: string, props) => [
                formatCurrency(value, currency),
                `${props.payload.memberName}の支払い額`,
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
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 凡例 */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {data.map((member) => (
          <div key={member.memberId} className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: member.color }} />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {member.memberName}: {formatCurrency(member.totalPaid, currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
