import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ErrorModal } from './ErrorModal';

describe('ErrorModal', () => {
  it('isOpenがfalseの場合は何も表示しない', () => {
    render(
      <ErrorModal isOpen={false} title="エラー" message="テストメッセージ" onClose={vi.fn()} />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('isOpenがtrueの場合にモーダルを表示する', () => {
    render(
      <ErrorModal isOpen={true} title="エラー" message="テストメッセージ" onClose={vi.fn()} />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('エラー')).toBeInTheDocument();
    expect(screen.getByText('テストメッセージ')).toBeInTheDocument();
  });

  it('OKボタンクリック時にonCloseが呼ばれる', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <ErrorModal isOpen={true} title="エラー" message="テストメッセージ" onClose={handleClose} />,
    );

    await user.click(screen.getByRole('button', { name: 'OK' }));

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('背景クリック時にonCloseが呼ばれる', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <ErrorModal isOpen={true} title="エラー" message="テストメッセージ" onClose={handleClose} />,
    );

    await user.click(screen.getByLabelText('モーダルを閉じる'));

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('Escapeキー押下時にonCloseが呼ばれる', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <ErrorModal isOpen={true} title="エラー" message="テストメッセージ" onClose={handleClose} />,
    );

    await user.keyboard('{Escape}');

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('カスタムボタンテキストが指定された場合に使用する', () => {
    render(
      <ErrorModal
        isOpen={true}
        title="エラー"
        message="テストメッセージ"
        onClose={vi.fn()}
        buttonText="閉じる"
      />,
    );

    expect(screen.getByRole('button', { name: '閉じる' })).toBeInTheDocument();
  });
});
