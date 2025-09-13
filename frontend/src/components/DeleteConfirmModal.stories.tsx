import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import { DeleteConfirmModal } from './DeleteConfirmModal'

const meta = {
  title: 'Components/DeleteConfirmModal',
  component: DeleteConfirmModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    isOpen: true,
    title: '削除の確認',
    message: 'この操作は取り消せません。削除してよろしいですか？',
    confirmText: '削除',
    cancelText: 'キャンセル',
    onConfirm: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof DeleteConfirmModal>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

