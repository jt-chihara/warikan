import { useEffect, useState } from 'react';
import type { Expense, Group } from '../types/group';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  expense?: Expense | null;
  onAddExpense: (expense: {
    amount: number;
    description: string;
    paidBy: string;
    splitAmong: string[];
  }) => void;
  onUpdateExpense?: (
    expenseId: string,
    expense: {
      amount: number;
      description: string;
      paidBy: string;
      splitAmong: string[];
    },
  ) => void;
}

export default function ExpenseModal({
  isOpen,
  onClose,
  group,
  expense,
  onAddExpense,
  onUpdateExpense,
}: ExpenseModalProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitAmong, setSplitAmong] = useState<string[]>([]);

  const isEditMode = Boolean(expense);

  useEffect(() => {
    if (expense) {
      setAmount(expense.amount.toString());
      setDescription(expense.description);
      setPaidBy(expense.paidById);
      setSplitAmong(expense.splitMembers.map((m) => m.memberId));
    } else {
      setAmount('');
      setDescription('');
      setPaidBy('');
      setSplitAmong([]);
    }
  }, [expense]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }

    return undefined;
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const expenseAmount = Number.parseFloat(amount);
    if (Number.isNaN(expenseAmount) || expenseAmount <= 0) {
      alert('有効な金額を入力してください。');
      return;
    }

    if (!paidBy) {
      alert('支払い者を選択してください。');
      return;
    }

    if (splitAmong.length === 0) {
      alert('割り勘対象者を選択してください。');
      return;
    }

    if (isEditMode && expense && onUpdateExpense) {
      onUpdateExpense(expense.id, {
        amount: expenseAmount,
        description: description.trim(),
        paidBy,
        splitAmong,
      });
    } else {
      onAddExpense({
        amount: expenseAmount,
        description: description.trim(),
        paidBy,
        splitAmong,
      });
    }

    // Reset form
    setAmount('');
    setDescription('');
    setPaidBy('');
    setSplitAmong([]);
    onClose();
  };

  const handleMemberToggle = (memberId: string) => {
    setSplitAmong((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId],
    );
  };

  const handleSelectAll = () => {
    const allMemberIds = group.members.map((m) => m.id);
    setSplitAmong(allMemberIds);
  };

  const handleClearAll = () => {
    setSplitAmong([]);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center sm:p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-t-lg sm:rounded-lg p-4 sm:p-6 w-full sm:max-w-md max-h-[85vh] sm:max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="document"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 id="modal-title" className="text-lg font-semibold">
            {isEditMode ? '支払いを編集' : '支払いを追加'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded transition-colors duration-200"
            aria-label="モーダルを閉じる"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-labelledby="close-icon-title"
            >
              <title id="close-icon-title">閉じる</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              金額
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="0"
              step="0.01"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="1000"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              説明
            </label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="例: 昼食代"
            />
          </div>

          <div>
            <label htmlFor="paidBy" className="block text-sm font-medium text-gray-700">
              支払い者
            </label>
            <select
              id="paidBy"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">支払い者を選択</option>
              {group.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="block text-sm font-medium text-gray-700" id="split-members-label">
                割り勘対象者
              </span>
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded transition-colors duration-200"
                  aria-label="全メンバーを選択"
                >
                  全選択
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs text-gray-600 hover:text-gray-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 rounded transition-colors duration-200"
                  aria-label="全メンバーの選択を解除"
                >
                  全解除
                </button>
              </div>
            </div>
            <fieldset className="space-y-2 max-h-32 overflow-y-auto">
              <legend className="sr-only">割り勘対象者選択</legend>
              {group.members.map((member) => (
                <label key={member.id} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={splitAmong.includes(member.id)}
                    onChange={() => handleMemberToggle(member.id)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 cursor-pointer"
                    aria-describedby={`member-${member.id}-desc`}
                  />
                  <span className="ml-2 text-sm text-gray-700" id={`member-${member.id}-desc`}>
                    {member.name}
                  </span>
                </label>
              ))}
            </fieldset>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
              aria-label={isEditMode ? '支払い情報を更新' : '新しい支払いを追加'}
            >
              {isEditMode ? '更新' : '追加'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
              aria-label="操作をキャンセルしてモーダルを閉じる"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
