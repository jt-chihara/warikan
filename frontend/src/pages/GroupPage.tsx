import { useState } from 'react';
import { useParams } from 'react-router-dom';
import ExpenseModal from '../components/ExpenseModal';
import { useAddExpense, useGroupExpenses } from '../hooks/useExpense';
import { useGroup } from '../hooks/useGroup';
import type { AddExpenseInput } from '../types/group';

export default function GroupPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { data, loading, error } = useGroup(groupId || '');
  const {
    data: expensesData,
    loading: expensesLoading,
    refetch: refetchExpenses,
  } = useGroupExpenses(groupId || '');
  const [addExpense] = useAddExpense();
  const [activeTab, setActiveTab] = useState<'expenses' | 'settlement'>('expenses');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const handleAddExpense = async (expense: {
    amount: number;
    description: string;
    paidBy: string;
    splitAmong: string[];
  }) => {
    try {
      const input: AddExpenseInput = {
        groupId: groupId || '',
        amount: expense.amount,
        description: expense.description,
        paidById: expense.paidBy,
        splitMemberIds: expense.splitAmong,
      };

      await addExpense({ variables: { input } });
      await refetchExpenses();
    } catch (err) {
      console.error('Error adding expense:', err);
      alert('支払いの追加に失敗しました。');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">エラーが発生しました: {error.message}</div>
      </div>
    );
  }

  if (!data?.group) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="text-yellow-800">グループが見つかりません。</div>
      </div>
    );
  }

  const group = data.group;

  return (
    <div>
      <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{group.name}</h2>
            {group.description && <p className="text-gray-600 mt-1">{group.description}</p>}
            <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500">
              <span>通貨: {group.currency}</span>
              <span>作成日: {new Date(group.createdAt).toLocaleDateString('ja-JP')}</span>
            </div>
          </div>
          <div className="self-start">
            <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              {group.members.length}人
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {group.members.map((member) => (
            <span
              key={member.id}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
            >
              {member.name}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              type="button"
              onClick={() => setActiveTab('expenses')}
              className={`py-3 px-4 sm:py-4 sm:px-6 border-b-2 font-medium text-sm flex-1 sm:flex-initial ${
                activeTab === 'expenses'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              支払い記録
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settlement')}
              className={`py-3 px-4 sm:py-4 sm:px-6 border-b-2 font-medium text-sm flex-1 sm:flex-initial ${
                activeTab === 'settlement'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              精算
            </button>
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === 'expenses' ? (
            <div>
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  支払いを追加
                </button>
              </div>

              {expensesLoading ? (
                <div className="text-center py-8 text-gray-600">読み込み中...</div>
              ) : expensesData?.groupExpenses?.length ? (
                <div className="space-y-4">
                  {expensesData.groupExpenses.map((expense) => (
                    <div key={expense.id} className="border rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <div className="flex-1">
                          <h4 className="font-semibold">{expense.description}</h4>
                          <p className="text-sm text-gray-600">{expense.paidByName}が支払い</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(expense.createdAt).toLocaleDateString('ja-JP')}
                          </p>
                        </div>
                        <div className="text-right self-start">
                          <p className="font-semibold text-lg sm:text-base">
                            ¥{expense.amount.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            {expense.splitMembers.length}人で割り勘
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <span>割り勘対象: </span>
                        <span>
                          {expense.splitMembers.map((member) => member.memberName).join(', ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">まだ支払い記録がありません。</div>
              )}
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">精算方法</h3>
                <p className="text-sm text-gray-600">最小の支払い回数で精算できる方法です</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span>花子 → 太郎</span>
                  <span className="font-semibold">¥10,000</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span>次郎 → 太郎</span>
                  <span className="font-semibold">¥10,000</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {group && (
        <ExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          group={group}
          onAddExpense={handleAddExpense}
        />
      )}
    </div>
  );
}
