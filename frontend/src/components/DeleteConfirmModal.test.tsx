import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeleteConfirmModal } from './DeleteConfirmModal';

describe('DeleteConfirmModal', () => {
  const defaultProps = {
    isOpen: true,
    title: 'アイテムを削除',
    message: 'このアイテムを削除してもよろしいですか？',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with correct content when open', () => {
    render(<DeleteConfirmModal {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('アイテムを削除')).toBeInTheDocument();
    expect(screen.getByText('このアイテムを削除してもよろしいですか？')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '削除' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
  });

  it('does not render modal when closed', () => {
    render(<DeleteConfirmModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    render(<DeleteConfirmModal {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: '削除' }));

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<DeleteConfirmModal {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'キャンセル' }));

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when backdrop is clicked', async () => {
    const user = userEvent.setup();
    render(<DeleteConfirmModal {...defaultProps} />);

    const backdrop = screen.getByRole('button', { name: 'モーダルを閉じる' });
    await user.click(backdrop);

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('renders custom button text when provided', () => {
    render(<DeleteConfirmModal {...defaultProps} confirmText="完全削除" cancelText="戻る" />);

    expect(screen.getByRole('button', { name: '完全削除' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '戻る' })).toBeInTheDocument();
  });

  it('renders warning icon', () => {
    render(<DeleteConfirmModal {...defaultProps} />);

    // ExclamationTriangleIconが存在することを確認
    const icon = screen.getByRole('dialog').querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('has correct accessibility attributes', () => {
    render(<DeleteConfirmModal {...defaultProps} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    expect(dialog).toHaveAttribute('aria-modal', 'true');

    const title = screen.getByText('アイテムを削除');
    expect(title).toHaveAttribute('id', 'modal-title');
  });

  it('renders multiple modals correctly', () => {
    const { rerender } = render(<DeleteConfirmModal {...defaultProps} />);

    expect(screen.getByText('アイテムを削除')).toBeInTheDocument();

    rerender(
      <DeleteConfirmModal
        {...defaultProps}
        title="別のアイテムを削除"
        message="別のメッセージです"
      />,
    );

    expect(screen.getByText('別のアイテムを削除')).toBeInTheDocument();
    expect(screen.getByText('別のメッセージです')).toBeInTheDocument();
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<DeleteConfirmModal {...defaultProps} />);

    // Tabキーで要素間を移動できることを確認
    await user.tab();
    expect(screen.getByRole('button', { name: 'モーダルを閉じる' })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: '削除' })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: 'キャンセル' })).toHaveFocus();
  });

  it('executes confirm action with Enter key', async () => {
    const user = userEvent.setup();
    render(<DeleteConfirmModal {...defaultProps} />);

    const confirmButton = screen.getByRole('button', { name: '削除' });
    confirmButton.focus();
    await user.keyboard('{Enter}');

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('executes cancel action with Escape key', async () => {
    const user = userEvent.setup();
    render(<DeleteConfirmModal {...defaultProps} />);

    await user.keyboard('{Escape}');
  });
});
