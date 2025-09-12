import { render, screen, fireEvent } from '@testing-library/react';
import meta, { Success, Error as ErrorStory, Info } from './Notification.stories';
import { vi } from 'vitest';

describe('Notification (stories)', () => {
  it('renders success message from story args', () => {
    const Component = meta.component;
    const props = { ...(meta.args ?? {}), ...(Success.args ?? {}) } as any;
    render(<Component {...props} onClose={() => {}} />);
    expect(screen.getByText('保存が完了しました')).toBeInTheDocument();
  });

  it('renders error variant', () => {
    const Component = meta.component;
    const props = { ...(meta.args ?? {}), ...(ErrorStory.args ?? {}) } as any;
    render(<Component {...props} onClose={() => {}} />);
    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    const Component = meta.component;
    const props = { ...(meta.args ?? {}), ...(Success.args ?? {}) } as any;
    render(<Component {...props} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: '閉じる' }));
    expect(onClose).toHaveBeenCalled();
  });
});
