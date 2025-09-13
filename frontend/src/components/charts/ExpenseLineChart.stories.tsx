import type { Meta, StoryObj } from '@storybook/react-vite'
import ExpenseLineChart from './ExpenseLineChart'
import type { DailyExpenseData } from '../../utils/chartUtils'

const data: DailyExpenseData[] = Array.from({ length: 14 }).map((_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (13 - i));
  const date = d.toISOString().split('T')[0]
  return {
    date,
    amount: Math.floor(1000 + Math.random() * 8000),
    count: Math.floor(1 + Math.random() * 4),
  }
})

const meta = {
  title: 'Components/Charts/ExpenseLineChart',
  component: ExpenseLineChart,
  tags: ['autodocs'],
  args: { data, currency: 'JPY' },
} satisfies Meta<typeof ExpenseLineChart>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

