import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

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
};

export const Info: Story = {
  args: { type: 'info', message: 'お知らせです' },
};
