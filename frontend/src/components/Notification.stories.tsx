import type { Meta, StoryObj } from '@storybook/react';
import { Notification } from './Notification';

const meta: Meta<typeof Notification> = {
  title: 'Components/Notification',
  component: Notification,
  tags: ['autodocs'],
  argTypes: {
    onClose: { action: 'onClose' },
  },
  args: {
    message: '保存が完了しました',
    type: 'success',
    duration: 10000,
  },
};

export default meta;

type Story = StoryObj<typeof Notification>;

export const Success: Story = {};

export const Error: Story = {
  args: {
    type: 'error',
    message: 'エラーが発生しました',
  },
};

export const Info: Story = {
  args: {
    type: 'info',
    message: 'お知らせがあります',
  },
};

