import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { ErrorModal } from './ErrorModal';

const meta = {
  title: 'Components/ErrorModal',
  component: ErrorModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    isOpen: true,
    title: '入力エラー',
    message: 'すべてのメンバー名を入力してください。',
    buttonText: 'OK',
    onClose: fn(),
  },
} satisfies Meta<typeof ErrorModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // モーダルが表示されていることを確認
    await expect(canvas.getByRole('dialog')).toBeInTheDocument();
    await expect(canvas.getByText('入力エラー')).toBeInTheDocument();
    await expect(canvas.getByText('すべてのメンバー名を入力してください。')).toBeInTheDocument();

    // OKボタンをクリック
    const okButton = canvas.getByRole('button', { name: 'OK' });
    await userEvent.click(okButton);
    await expect(args.onClose).toHaveBeenCalled();
  },
};

export const CustomButtonText: Story = {
  args: {
    buttonText: '閉じる',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: '閉じる' })).toBeInTheDocument();
  },
};

export const LongMessage: Story = {
  args: {
    title: 'エラーが発生しました',
    message:
      'ネットワーク接続に問題が発生しました。インターネット接続を確認して、もう一度お試しください。問題が解決しない場合は、サポートまでお問い合わせください。',
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // モーダルが表示されていないことを確認
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument();
  },
};
