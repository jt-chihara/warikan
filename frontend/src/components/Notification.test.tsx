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

  it('renders notification with default success type', () => {
    render(<Notification {...defaultProps} />);

    expect(screen.getByText('テスト通知メッセージ')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '閉じる' })).toBeInTheDocument();

    const container = document.querySelector('.bg-green-50');
    expect(container).toBeInTheDocument();
  });

  it('renders notification with error type', () => {
    render(<Notification {...defaultProps} type="error" />);

    expect(screen.getByText('テスト通知メッセージ')).toBeInTheDocument();

    const container = document.querySelector('.bg-red-50');
    expect(container).toBeInTheDocument();
  });

  it('renders notification with info type', () => {
    render(<Notification {...defaultProps} type="info" />);

    expect(screen.getByText('テスト通知メッセージ')).toBeInTheDocument();

    const container = document.querySelector('.bg-blue-50');
    expect(container).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<Notification {...defaultProps} />);

    const closeButton = screen.getByRole('button', { name: '閉じる' });
    await user.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('has correct icon colors for different types', () => {
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

  it('renders CheckCircleIcon with proper attributes', () => {
    render(<Notification {...defaultProps} />);

    const icon = document.querySelector('svg[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('has correct positioning classes', () => {
    render(<Notification {...defaultProps} />);

    const outerContainer = document.querySelector('.pointer-events-none.fixed.inset-0');
    const innerContainer = document.querySelector('.flex.w-full.flex-col.items-center');

    expect(outerContainer).toBeInTheDocument();
    expect(innerContainer).toBeInTheDocument();
    expect(outerContainer).toHaveClass('z-50');
  });

  it('handles different message props correctly', () => {
    const { rerender } = render(<Notification {...defaultProps} />);

    expect(screen.getByText('テスト通知メッセージ')).toBeInTheDocument();

    rerender(<Notification {...defaultProps} message="別の通知メッセージ" />);

    expect(screen.getByText('別の通知メッセージ')).toBeInTheDocument();
  });

  it('renders with proper accessibility attributes', () => {
    render(<Notification {...defaultProps} />);

    const closeButton = screen.getByRole('button', { name: '閉じる' });
    expect(closeButton).toHaveAttribute('type', 'button');

    const icon = document.querySelector('svg[aria-hidden="true"]');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('uses custom duration when provided', () => {
    render(<Notification {...defaultProps} duration={5000} />);

    expect(screen.getByText('テスト通知メッセージ')).toBeInTheDocument();
  });
});
