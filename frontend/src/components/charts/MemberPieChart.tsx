import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { MemberExpenseData } from '../../utils/chartUtils';
import { formatCurrency } from '../../utils/chartUtils';

interface MemberPieChartProps {
  data: MemberExpenseData[];
  currency?: string;
}

export default function MemberPieChart({ data, currency = 'JPY' }: MemberPieChartProps) {
  if (data.length === 0) {
    return (
      <div className="w-full h-80 flex items-center justify-center">
        <p className="text-gray-500">支払いデータがありません</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">メンバー別支払い分布</h3>
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
            >
              {data.map((entry) => (
                <Cell key={`cell-${entry.memberId}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, _name: string, props) => [
                formatCurrency(value, currency),
                `${props.payload.memberName}の支払い額`,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 凡例 */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {data.map((member) => (
          <div key={member.memberId} className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: member.color }} />
            <span className="text-sm text-gray-700">
              {member.memberName}: {formatCurrency(member.totalPaid, currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
