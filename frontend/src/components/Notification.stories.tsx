import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { Notification } from './Notification';

const meta = {
  title: 'Components/Notification',
  component: Notification,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    message: '保存しました',
    type: 'success',
    duration: 3000,
    onClose: fn(),
  },
  argTypes: {
    type: {
      control: { type: 'radio' },
      options: ['success', 'error', 'info'],
    },
  },
} satisfies Meta<typeof Notification>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {};

export const ErrorState: Story = {
  args: { type: 'error', message: 'エラーが発生しました' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const close = canvas.getByRole('button', { name: '閉じる' });
    await userEvent.click(close);
    await expect(args.onClose).toHaveBeenCalled();
  },
};

export const Info: Story = {
  args: { type: 'info', message: 'お知らせです' },
};
