import type { Meta, StoryObj } from '@storybook/react';
import { DeleteConfirmModal } from './DeleteConfirmModal';

const meta: Meta<typeof DeleteConfirmModal> = {
  title: 'Components/DeleteConfirmModal',
  component: DeleteConfirmModal,
  tags: ['autodocs'],
  argTypes: {
    onConfirm: { action: 'onConfirm' },
    onCancel: { action: 'onCancel' },
  },
  args: {
    isOpen: true,
    title: '削除の確認',
    message: 'この操作は取り消せません。本当に削除しますか？',
  },
};

export default meta;

type Story = StoryObj<typeof DeleteConfirmModal>;

export const Default: Story = {};

