import type { Meta, StoryObj } from '@storybook/react-vite'
import MemberPieChart from './MemberPieChart'
import type { MemberExpenseData } from '../../utils/chartUtils'

const data: MemberExpenseData[] = [
  { memberId: 'u1', memberName: '太郎', totalPaid: 12000, expenseCount: 5, color: '#3B82F6' },
  { memberId: 'u2', memberName: '花子', totalPaid: 8000, expenseCount: 4, color: '#EF4444' },
  { memberId: 'u3', memberName: '次郎', totalPaid: 6000, expenseCount: 3, color: '#10B981' },
]

const meta = {
  title: 'Components/Charts/MemberPieChart',
  component: MemberPieChart,
  tags: ['autodocs'],
  args: { data, currency: 'JPY' },
} satisfies Meta<typeof MemberPieChart>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

