import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Notification } from './Notification';

describe('Notification', () => {
  const defaultProps = {
    message: 'テスト通知メッセージ',
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('デフォルトのsuccessタイプで通知を表示する', () => {
    render(<Notification {...defaultProps} />);

    expect(screen.getByText('テスト通知メッセージ')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '閉じる' })).toBeInTheDocument();

    const container = document.querySelector('.bg-green-100');
    expect(container).toBeInTheDocument();
  });

  it('errorタイプで通知を表示する', () => {
    render(<Notification {...defaultProps} type="error" />);

    expect(screen.getByText('テスト通知メッセージ')).toBeInTheDocument();

    const container = document.querySelector('.bg-red-100');
    expect(container).toBeInTheDocument();
  });

  it('infoタイプで通知を表示する', () => {
    render(<Notification {...defaultProps} type="info" />);

    expect(screen.getByText('テスト通知メッセージ')).toBeInTheDocument();

    const container = document.querySelector('.bg-blue-100');
    expect(container).toBeInTheDocument();
  });

  it('閉じるボタンクリック時にonCloseが呼ばれる', async () => {
    const user = userEvent.setup();
    render(<Notification {...defaultProps} />);

    const closeButton = screen.getByRole('button', { name: '閉じる' });
    await user.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('タイプごとに正しいアイコン色を持つ', () => {
    const { rerender } = render(<Notification {...defaultProps} type="success" />);

    let icon = document.querySelector('.text-green-400');
    expect(icon).toBeInTheDocument();

    rerender(<Notification {...defaultProps} type="error" />);
    icon = document.querySelector('.text-red-400');
    expect(icon).toBeInTheDocument();

    rerender(<Notification {...defaultProps} type="info" />);
    icon = document.querySelector('.text-blue-400');
    expect(icon).toBeInTheDocument();
  });

  it('CheckCircleIconを正しい属性で表示する', () => {
    render(<Notification {...defaultProps} />);

    const icon = document.querySelector('svg[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('正しい位置指定クラスを持つ', () => {
    render(<Notification {...defaultProps} />);

    const outerContainer = document.querySelector('.pointer-events-none.fixed.inset-0');
    const innerContainer = document.querySelector('.flex.w-full.flex-col.items-center');

    expect(outerContainer).toBeInTheDocument();
    expect(innerContainer).toBeInTheDocument();
    expect(outerContainer).toHaveClass('z-50');
  });

  it('異なるmessageプロパティを正しく処理する', () => {
    const { rerender } = render(<Notification {...defaultProps} />);

    expect(screen.getByText('テスト通知メッセージ')).toBeInTheDocument();

    rerender(<Notification {...defaultProps} message="別の通知メッセージ" />);

    expect(screen.getByText('別の通知メッセージ')).toBeInTheDocument();
  });

  it('正しいアクセシビリティ属性で表示する', () => {
    render(<Notification {...defaultProps} />);

    const closeButton = screen.getByRole('button', { name: '閉じる' });
    expect(closeButton).toHaveAttribute('type', 'button');

    const icon = document.querySelector('svg[aria-hidden="true"]');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('カスタムdurationが指定された場合に使用する', () => {
    render(<Notification {...defaultProps} duration={5000} />);

    expect(screen.getByText('テスト通知メッセージ')).toBeInTheDocument();
  });
});
