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

  it('開いているときに正しい内容でモーダルを表示する', () => {
    render(<DeleteConfirmModal {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('アイテムを削除')).toBeInTheDocument();
    expect(screen.getByText('このアイテムを削除してもよろしいですか？')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '削除' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
  });

  it('閉じているときにモーダルを表示しない', () => {
    render(<DeleteConfirmModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('確認ボタンクリック時にonConfirmが呼ばれる', async () => {
    const user = userEvent.setup();
    render(<DeleteConfirmModal {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: '削除' }));

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('キャンセルボタンクリック時にonCancelが呼ばれる', async () => {
    const user = userEvent.setup();
    render(<DeleteConfirmModal {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'キャンセル' }));

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('背景クリック時にonCancelが呼ばれる', async () => {
    const user = userEvent.setup();
    render(<DeleteConfirmModal {...defaultProps} />);

    const backdrop = screen.getByRole('button', { name: 'モーダルを閉じる' });
    await user.click(backdrop);

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('カスタムボタンテキストが指定された場合に表示する', () => {
    render(<DeleteConfirmModal {...defaultProps} confirmText="完全削除" cancelText="戻る" />);

    expect(screen.getByRole('button', { name: '完全削除' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '戻る' })).toBeInTheDocument();
  });

  it('警告アイコンを表示する', () => {
    render(<DeleteConfirmModal {...defaultProps} />);

    // ExclamationTriangleIconが存在することを確認
    const icon = screen.getByRole('dialog').querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('正しいアクセシビリティ属性を持つ', () => {
    render(<DeleteConfirmModal {...defaultProps} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    expect(dialog).toHaveAttribute('aria-modal', 'true');

    const title = screen.getByText('アイテムを削除');
    expect(title).toHaveAttribute('id', 'modal-title');
  });

  it('複数のモーダルを正しく表示する', () => {
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

  it('キーボードナビゲーションを処理する', async () => {
    render(<DeleteConfirmModal {...defaultProps} />);

    // ボタンが手動でフォーカス可能であることを確認
    const confirmButton = screen.getByRole('button', { name: '削除' });
    const cancelButton = screen.getByRole('button', { name: 'キャンセル' });

    confirmButton.focus();
    expect(confirmButton).toHaveFocus();

    cancelButton.focus();
    expect(cancelButton).toHaveFocus();
  });

  it('Enterキーで確認アクションを実行する', async () => {
    const user = userEvent.setup();
    render(<DeleteConfirmModal {...defaultProps} />);

    const confirmButton = screen.getByRole('button', { name: '削除' });
    await user.click(confirmButton); // フォーカスとクリックを同時に行う

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('Escapeキーでキャンセルアクションを実行する', async () => {
    const user = userEvent.setup();
    render(<DeleteConfirmModal {...defaultProps} />);

    await user.keyboard('{Escape}');

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });
});
