import type { Meta, StoryObj } from '@storybook/react-vite'
import MonthlyBarChart from './MonthlyBarChart'
import type { MonthlyExpenseData } from '../../utils/chartUtils'

const data: MonthlyExpenseData[] = [
  { month: '2025-05', amount: 12000, count: 8 },
  { month: '2025-06', amount: 18500, count: 12 },
  { month: '2025-07', amount: 9800, count: 6 },
  { month: '2025-08', amount: 22500, count: 14 },
  { month: '2025-09', amount: 14200, count: 9 },
]

const meta = {
  title: 'Components/Charts/MonthlyBarChart',
  component: MonthlyBarChart,
  tags: ['autodocs'],
  args: { data, currency: 'JPY' },
} satisfies Meta<typeof MonthlyBarChart>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

