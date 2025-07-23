import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExpenseModal from './ExpenseModal';
import type { Group } from '../types/group';

const mockGroup: Group = {
  id: 'group-123',
  name: 'テストグループ',
  currency: 'JPY',
  createdAt: '2024-01-01',
  members: [
    { id: 'member-1', name: 'Alice', joinedAt: '2024-01-01' },
    { id: 'member-2', name: 'Bob', joinedAt: '2024-01-01' },
    { id: 'member-3', name: 'Carol', joinedAt: '2024-01-01' },
  ],
};

describe('ExpenseModal', () => {
  const mockOnClose = vi.fn();
  const mockOnAddExpense = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ExpenseModal
        isOpen={false}
        onClose={mockOnClose}
        group={mockGroup}
        onAddExpense={mockOnAddExpense}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal when isOpen is true', () => {
    render(
      <ExpenseModal
        isOpen={true}
        onClose={mockOnClose}
        group={mockGroup}
        onAddExpense={mockOnAddExpense}
      />
    );
    
    expect(screen.getByText('支払いを追加')).toBeInTheDocument();
    expect(screen.getByLabelText('金額')).toBeInTheDocument();
    expect(screen.getByLabelText('説明')).toBeInTheDocument();
    expect(screen.getByLabelText('支払い者')).toBeInTheDocument();
  });

  it('closes modal when close button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <ExpenseModal
        isOpen={true}
        onClose={mockOnClose}
        group={mockGroup}
        onAddExpense={mockOnAddExpense}
      />
    );
    
    const closeButton = screen.getByLabelText('閉じる');
    await user.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('validates invalid amount', async () => {
    const user = userEvent.setup();
    window.alert = vi.fn();
    
    render(
      <ExpenseModal
        isOpen={true}
        onClose={mockOnClose}
        group={mockGroup}
        onAddExpense={mockOnAddExpense}
      />
    );
    
    // 無効な値を入力
    const amountInput = screen.getByLabelText('金額');
    await user.type(amountInput, 'abc');
    
    // フォームを直接送信
    const form = document.querySelector('form');
    if (form) {
      fireEvent.submit(form);
    }
    
    expect(window.alert).toHaveBeenCalledWith('有効な金額を入力してください。');
    expect(mockOnAddExpense).not.toHaveBeenCalled();
  });

  it('validates no payer selected', async () => {
    const user = userEvent.setup();
    window.alert = vi.fn();
    
    render(
      <ExpenseModal
        isOpen={true}
        onClose={mockOnClose}
        group={mockGroup}
        onAddExpense={mockOnAddExpense}
      />
    );
    
    // 金額を入力
    const amountInput = screen.getByLabelText('金額');
    await user.type(amountInput, '1000');
    
    // 説明を入力
    const descriptionInput = screen.getByLabelText('説明');
    await user.type(descriptionInput, 'ランチ');
    
    // フォームを直接送信
    const form = document.querySelector('form');
    if (form) {
      fireEvent.submit(form);
    }
    
    expect(window.alert).toHaveBeenCalledWith('支払い者を選択してください。');
    expect(mockOnAddExpense).not.toHaveBeenCalled();
  });

  it('validates no split members selected', async () => {
    const user = userEvent.setup();
    window.alert = vi.fn();
    
    render(
      <ExpenseModal
        isOpen={true}
        onClose={mockOnClose}
        group={mockGroup}
        onAddExpense={mockOnAddExpense}
      />
    );
    
    // 金額を入力
    const amountInput = screen.getByLabelText('金額');
    await user.type(amountInput, '1000');
    
    // 説明を入力
    const descriptionInput = screen.getByLabelText('説明');
    await user.type(descriptionInput, 'ランチ');
    
    // 支払い者を選択
    const payerSelect = screen.getByLabelText('支払い者');
    await user.selectOptions(payerSelect, 'member-1');
    
    const submitButton = screen.getByText('追加');
    await user.click(submitButton);
    
    expect(window.alert).toHaveBeenCalledWith('割り勘対象者を選択してください。');
    expect(mockOnAddExpense).not.toHaveBeenCalled();
  });

  it('submits valid expense data', async () => {
    const user = userEvent.setup();
    
    render(
      <ExpenseModal
        isOpen={true}
        onClose={mockOnClose}
        group={mockGroup}
        onAddExpense={mockOnAddExpense}
      />
    );
    
    // 金額を入力
    const amountInput = screen.getByLabelText('金額');
    await user.type(amountInput, '3000');
    
    // 説明を入力
    const descriptionInput = screen.getByLabelText('説明');
    await user.type(descriptionInput, 'ランチ代');
    
    // 支払い者を選択
    const payerSelect = screen.getByLabelText('支払い者');
    await user.selectOptions(payerSelect, 'member-1');
    
    // 全員を選択
    const selectAllButton = screen.getByText('全選択');
    await user.click(selectAllButton);
    
    // フォームを送信
    const submitButton = screen.getByText('追加');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnAddExpense).toHaveBeenCalledWith({
        amount: 3000,
        description: 'ランチ代',
        paidBy: 'member-1',
        splitAmong: ['member-1', 'member-2', 'member-3'],
      });
    });
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles select all and clear all buttons', async () => {
    const user = userEvent.setup();
    
    render(
      <ExpenseModal
        isOpen={true}
        onClose={mockOnClose}
        group={mockGroup}
        onAddExpense={mockOnAddExpense}
      />
    );
    
    // 全選択
    const selectAllButton = screen.getByText('全選択');
    await user.click(selectAllButton);
    
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach(checkbox => {
      expect(checkbox).toBeChecked();
    });
    
    // 全解除
    const clearAllButton = screen.getByText('全解除');
    await user.click(clearAllButton);
    
    checkboxes.forEach(checkbox => {
      expect(checkbox).not.toBeChecked();
    });
  });
});