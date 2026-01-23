import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ErrorModal } from './ErrorModal';

describe('ErrorModal', () => {
  it('renders nothing when isOpen is false', () => {
    render(
      <ErrorModal
        isOpen={false}
        title="エラー"
        message="テストメッセージ"
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders modal when isOpen is true', () => {
    render(
      <ErrorModal
        isOpen={true}
        title="エラー"
        message="テストメッセージ"
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('エラー')).toBeInTheDocument();
    expect(screen.getByText('テストメッセージ')).toBeInTheDocument();
  });

  it('calls onClose when OK button is clicked', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <ErrorModal
        isOpen={true}
        title="エラー"
        message="テストメッセージ"
        onClose={handleClose}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'OK' }));

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <ErrorModal
        isOpen={true}
        title="エラー"
        message="テストメッセージ"
        onClose={handleClose}
      />,
    );

    await user.click(screen.getByLabelText('モーダルを閉じる'));

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <ErrorModal
        isOpen={true}
        title="エラー"
        message="テストメッセージ"
        onClose={handleClose}
      />,
    );

    await user.keyboard('{Escape}');

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('uses custom button text when provided', () => {
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
