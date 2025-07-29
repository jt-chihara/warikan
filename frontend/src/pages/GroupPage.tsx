import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ExpenseModal from '../components/ExpenseModal';
import {
  useAddExpense,
  useDeleteExpense,
  useGroupExpenses,
  useUpdateExpense,
} from '../hooks/useExpense';
import { useCalculateSettlements, useGroup } from '../hooks/useGroup';
import { formatDateFromGraphQL } from '../lib/dateUtils';
import type {
  AddExpenseInput,
  Expense,
  ExpenseInput,
  SettlementResult,
  UpdateExpenseInput,
} from '../types/group';

export default function GroupPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { data, loading, error } = useGroup(groupId || '');
  const {
    data: expensesData,
    loading: expensesLoading,
    refetch: refetchExpenses,
  } = useGroupExpenses(groupId || '');
  const [addExpense] = useAddExpense();
  const [updateExpense] = useUpdateExpense();
  const [deleteExpense] = useDeleteExpense();
  const [activeTab, setActiveTab] = useState<'expenses' | 'settlement'>('expenses');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [settlementResult, setSettlementResult] = useState<SettlementResult | null>(null);
  const { refetch: calculateSettlements, loading: settlementLoading } = useCalculateSettlements();

  const calculateSettlement = useCallback(async () => {
    if (!expensesData?.groupExpenses || !groupId) return;

    try {
      // Convert frontend expenses to the format expected by backend
      const expenses: ExpenseInput[] = expensesData.groupExpenses.map((expense) => ({
        id: expense.id,
        payerId: expense.paidById,
        amount: expense.amount,
        splitBetween: expense.splitMembers.map((member) => member.memberId),
      }));

      const result = await calculateSettlements({
        groupId,
        expenses,
      });

      if (result.data?.calculateSettlements) {
        setSettlementResult(result.data.calculateSettlements);
      }
    } catch (err) {
      console.error('Error calculating settlements:', err);
    }
  }, [expensesData?.groupExpenses, groupId, calculateSettlements]);

  // Calculate settlements when expenses or tab changes
  useEffect(() => {
    if (activeTab === 'settlement' && expensesData?.groupExpenses && groupId) {
      calculateSettlement();
    }
  }, [activeTab, expensesData?.groupExpenses, groupId, calculateSettlement]);

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
      // Reset settlement result to trigger recalculation
      setSettlementResult(null);
    } catch (err) {
      console.error('Error adding expense:', err);
      alert('支払いの追加に失敗しました。');
    }
  };

  const handleUpdateExpense = async (
    expenseId: string,
    expense: {
      amount: number;
      description: string;
      paidBy: string;
      splitAmong: string[];
    },
  ) => {
    try {
      const input: UpdateExpenseInput = {
        expenseId,
        amount: expense.amount,
        description: expense.description,
        paidById: expense.paidBy,
        splitMemberIds: expense.splitAmong,
      };

      await updateExpense({ variables: { input } });
      await refetchExpenses();
      // Reset settlement result to trigger recalculation
      setSettlementResult(null);
      setEditingExpense(null);
    } catch (err) {
      console.error('Error updating expense:', err);
      alert('支払いの更新に失敗しました。');
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('この支払い記録を削除してもよろしいですか？')) {
      return;
    }

    try {
      await deleteExpense({ variables: { expenseId } });
      await refetchExpenses();
      // Reset settlement result to trigger recalculation
      setSettlementResult(null);
    } catch (err) {
      console.error('Error deleting expense:', err);
      alert('支払いの削除に失敗しました。');
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    // 存在しないグループの場合の特別なメッセージ
    const isGroupNotFound =
      error.message.includes('sql: no rows in result set') ||
      error.message.includes('not found') ||
      error.message.includes('group not found');

    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">
          {isGroupNotFound
            ? 'そのグループは存在しません。'
            : `エラーが発生しました: ${error.message}`}
        </div>
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
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{group.name}</h2>
            {group.description && <p className="text-gray-600 mt-1">{group.description}</p>}
            <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500">
              <span>通貨: {group.currency}</span>
              <span>作成日: {formatDateFromGraphQL(group.createdAt)}</span>
            </div>
          </div>
          {/* Desktop: 人数とボタンを右に表示 */}
          <div className="hidden sm:flex flex-col gap-2 self-start">
            <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm text-center">
              {group.members.length}人
            </span>
            <Link
              to={`/groups/${group.id}/analytics`}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 active:bg-blue-800 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm"
            >
              📊 データ分析
            </Link>
          </div>
        </div>

        {/* Mobile: 人数表示 */}
        <div className="mt-4 sm:hidden">
          <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
            {group.members.length}人
          </span>
        </div>

        {/* メンバー一覧 */}
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

        {/* Mobile: データ分析ボタン */}
        <div className="mt-4 sm:hidden">
          <Link
            to={`/groups/${group.id}/analytics`}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 active:bg-blue-800 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm w-full sm:w-auto"
          >
            📊 データ分析
          </Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <div className="-mb-px flex" role="tablist" aria-label="グループ情報タブ">
            <button
              type="button"
              onClick={() => setActiveTab('expenses')}
              className={`py-3 px-4 sm:py-4 sm:px-6 border-b-2 font-medium text-sm flex-1 sm:flex-initial cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-all duration-200 active:scale-95 ${
                activeTab === 'expenses'
                  ? 'border-blue-500 text-blue-600 active:text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 active:text-gray-800'
              }`}
              role="tab"
              aria-selected={activeTab === 'expenses'}
              aria-controls="expenses-panel"
            >
              支払い記録
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settlement')}
              className={`py-3 px-4 sm:py-4 sm:px-6 border-b-2 font-medium text-sm flex-1 sm:flex-initial cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-all duration-200 active:scale-95 ${
                activeTab === 'settlement'
                  ? 'border-blue-500 text-blue-600 active:text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 active:text-gray-800'
              }`}
              role="tab"
              aria-selected={activeTab === 'settlement'}
              aria-controls="settlement-panel"
            >
              精算
            </button>
          </div>
        </div>

        <div
          className="p-4 sm:p-6"
          role="tabpanel"
          id={activeTab === 'expenses' ? 'expenses-panel' : 'settlement-panel'}
          aria-labelledby={activeTab === 'expenses' ? 'expenses-tab' : 'settlement-tab'}
        >
          {activeTab === 'expenses' ? (
            <div>
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 active:bg-blue-800 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer transition-all duration-200"
                  aria-label="支払いを追加"
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
                            {formatDateFromGraphQL(expense.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-right">
                            <p className="font-semibold text-lg sm:text-base">
                              ¥{expense.amount.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600">
                              {expense.splitMembers.length}人で割り勘
                            </p>
                          </div>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => handleEditExpense(expense)}
                              className="text-blue-600 hover:text-blue-700 active:text-blue-800 active:scale-95 text-sm font-medium underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded transition-all duration-200"
                              aria-label={`${expense.description}の支払いを編集`}
                            >
                              編集
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="text-red-600 hover:text-red-700 active:text-red-800 active:scale-95 text-sm font-medium underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 rounded transition-all duration-200"
                              aria-label={`${expense.description}の支払いを削除`}
                            >
                              削除
                            </button>
                          </div>
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

              {settlementLoading ? (
                <div className="text-center py-8 text-gray-600">計算中...</div>
              ) : settlementResult?.settlements?.length ? (
                <div className="space-y-3">
                  {settlementResult.settlements.map((settlement) => (
                    <div
                      key={`${settlement.fromMemberId}-${settlement.toMemberId}`}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span>
                        {settlement.fromName} → {settlement.toName}
                      </span>
                      <span className="font-semibold">¥{settlement.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {expensesData?.groupExpenses?.length
                    ? '精算の必要がありません'
                    : '支払い記録がないため精算できません'}
                </div>
              )}

              {settlementResult?.balances?.length && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">各メンバーの収支</h3>
                  <div className="space-y-2">
                    {settlementResult.balances.map((balance) => (
                      <div
                        key={balance.memberId}
                        className="flex items-center justify-between p-3 bg-white border rounded-lg"
                      >
                        <span>{balance.memberName}</span>
                        <span
                          className={`font-semibold ${
                            balance.balance > 0
                              ? 'text-green-600'
                              : balance.balance < 0
                                ? 'text-red-600'
                                : 'text-gray-600'
                          }`}
                        >
                          {balance.balance > 0 && '+'}¥{balance.balance.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    ※ 正の値: 受け取る金額、負の値: 支払う金額
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {group && (
        <ExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={() => {
            setIsExpenseModalOpen(false);
            setEditingExpense(null);
          }}
          group={group}
          expense={editingExpense}
          onAddExpense={handleAddExpense}
          onUpdateExpense={handleUpdateExpense}
        />
      )}
    </div>
  );
}
