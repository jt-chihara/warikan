import { render, screen, fireEvent } from '@testing-library/react';
import meta, { Default } from './DeleteConfirmModal.stories';
import { vi } from 'vitest';

describe('DeleteConfirmModal (stories)', () => {
  it('shows title and message', () => {
    const Component = meta.component;
    const props = { ...(meta.args ?? {}), ...(Default.args ?? {}) } as any;
    render(<Component {...props} onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByText('削除の確認')).toBeInTheDocument();
    expect(screen.getByText('この操作は取り消せません。本当に削除しますか？')).toBeInTheDocument();
  });

  it('fires onConfirm when clicking the delete button', () => {
    const onConfirm = vi.fn();
    const Component = meta.component;
    const props = { ...(meta.args ?? {}), ...(Default.args ?? {}) } as any;
    render(<Component {...props} onConfirm={onConfirm} onCancel={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: '削除' }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('fires onCancel when clicking the overlay', () => {
    const onCancel = vi.fn();
    const Component = meta.component;
    const props = { ...(meta.args ?? {}), ...(Default.args ?? {}) } as any;
    render(<Component {...props} onConfirm={() => {}} onCancel={onCancel} />);
    fireEvent.click(screen.getByLabelText('モーダルを閉じる'));
    expect(onCancel).toHaveBeenCalled();
  });
});
