import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import ExpenseModal from './ExpenseModal'
import type { Group, Expense } from '../types/group'

const sampleGroup: Group = {
  id: 'g1',
  name: '旅行メンバー',
  currency: 'JPY',
  createdAt: new Date().toISOString(),
  members: [
    { id: 'u1', name: '太郎', joinedAt: new Date().toISOString() },
    { id: 'u2', name: '花子', joinedAt: new Date().toISOString() },
    { id: 'u3', name: '次郎', joinedAt: new Date().toISOString() },
  ],
}

const sampleExpense: Expense = {
  id: 'e1',
  groupId: 'g1',
  amount: 4500,
  description: '昼食',
  paidById: 'u1',
  paidByName: '太郎',
  splitMembers: [
    { memberId: 'u1', memberName: '太郎', amount: 1500 },
    { memberId: 'u2', memberName: '花子', amount: 1500 },
    { memberId: 'u3', memberName: '次郎', amount: 1500 },
  ],
  createdAt: new Date().toISOString(),
}

const meta = {
  title: 'Components/ExpenseModal',
  component: ExpenseModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    isOpen: true,
    group: sampleGroup,
    onClose: fn(),
    onAddExpense: fn(),
  },
} satisfies Meta<typeof ExpenseModal>

export default meta
type Story = StoryObj<typeof meta>

export const Create: Story = {}

export const Edit: Story = {
  args: {
    expense: sampleExpense,
    onUpdateExpense: fn(),
  },
}

