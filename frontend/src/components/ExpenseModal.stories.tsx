import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import type { Expense, Group } from '../types/group';
import ExpenseModal from './ExpenseModal';

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
};

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
};

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
} satisfies Meta<typeof ExpenseModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await userEvent.clear(canvas.getByLabelText('金額'));
    await userEvent.type(canvas.getByLabelText('金額'), '1200');
    await userEvent.type(canvas.getByLabelText('説明'), 'カフェ');
    await userEvent.selectOptions(canvas.getByLabelText('支払い者'), 'u1');

    await userEvent.click(canvas.getByLabelText('太郎'));
    await userEvent.click(canvas.getByLabelText('花子'));

    await userEvent.click(canvas.getByRole('button', { name: '新しい支払いを追加' }));

    await expect(args.onAddExpense).toHaveBeenCalled();
  },
};

export const Edit: Story = {
  args: {
    expense: sampleExpense,
    onUpdateExpense: fn(),
  },
};
