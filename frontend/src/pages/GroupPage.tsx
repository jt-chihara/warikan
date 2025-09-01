import { LinkIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import ExpenseModal from '../components/ExpenseModal';
import { Notification } from '../components/Notification';
import {
  useAddExpense,
  useDeleteExpense,
  useGroupExpenses,
  useUpdateExpense,
} from '../hooks/useExpense';
import { useCalculateSettlements, useGroup } from '../hooks/useGroup';
import { formatTimestamp } from '../lib/dateUtils';
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
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    expenseId: string | null;
    expenseName: string;
  }>({
    isOpen: false,
    expenseId: null,
    expenseName: '',
  });
  const [copySuccess, setCopySuccess] = useState(false);

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
      // Show success notification
      setNotification({
        message: '支払いを追加しました',
        type: 'success',
      });
    } catch (err) {
      console.error('Error adding expense:', err);
      setNotification({
        message: '支払いの追加に失敗しました',
        type: 'error',
      });
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
      // Show success notification
      setNotification({
        message: '支払いを更新しました',
        type: 'success',
      });
    } catch (err) {
      console.error('Error updating expense:', err);
      setNotification({
        message: '支払いの更新に失敗しました',
        type: 'error',
      });
    }
  };

  const openDeleteConfirm = (expenseId: string, expenseName: string) => {
    setDeleteConfirm({
      isOpen: true,
      expenseId,
      expenseName,
    });
  };

  const handleDeleteExpense = async () => {
    if (!deleteConfirm.expenseId) return;

    try {
      await deleteExpense({ variables: { expenseId: deleteConfirm.expenseId } });
      await refetchExpenses();
      // Reset settlement result to trigger recalculation
      setSettlementResult(null);
      // Show success notification
      setNotification({
        message: '支払いを削除しました',
        type: 'success',
      });
      // Close the modal
      setDeleteConfirm({ isOpen: false, expenseId: null, expenseName: '' });
    } catch (err) {
      console.error('Error deleting expense:', err);
      setNotification({
        message: '支払いの削除に失敗しました',
        type: 'error',
      });
      // エラーの場合でもモーダルを閉じる
      setDeleteConfirm({ isOpen: false, expenseId: null, expenseName: '' });
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  };

  const handleCopyInviteLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(true);
      setNotification({
        message: '招待リンクをコピーしました',
        type: 'success',
      });
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
      setNotification({
        message: 'コピーに失敗しました',
        type: 'error',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-gray-600 dark:text-gray-300">読み込み中...</div>
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
      <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md p-4">
        <div className="text-red-800 dark:text-red-200">
          {isGroupNotFound
            ? 'そのグループは存在しません。'
            : `エラーが発生しました: ${error.message}`}
        </div>
      </div>
    );
  }

  if (!data?.group) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-md p-4">
        <div className="text-yellow-800 dark:text-yellow-200">グループが見つかりません。</div>
      </div>
    );
  }

  const group = data.group;

  return (
    <div>
      <div className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-900/20 rounded-lg p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              {group.name}
            </h2>
            {group.description && (
              <p className="text-gray-600 dark:text-gray-300 mt-1">{group.description}</p>
            )}
            <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span>通貨: {group.currency}</span>
              <span>作成日: {formatTimestamp(group.createdAt)}</span>
            </div>
          </div>
          {/* Desktop: 人数とボタンを右に表示 */}
          <div className="hidden sm:flex flex-col gap-2 self-start">
            <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm text-center">
              {group.members.length}人
            </span>
            <button
              type="button"
              onClick={handleCopyInviteLink}
              className="inline-flex items-center justify-center px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-md text-sm font-medium hover:bg-green-700 dark:hover:bg-green-600 active:bg-green-800 dark:active:bg-green-500 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-sm"
            >
              <LinkIcon className="h-4 w-4 mr-1" />
              {copySuccess ? 'コピー完了!' : '招待リンク'}
            </button>
            <Link
              to={`/groups/${group.id}/analytics`}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 active:bg-blue-800 dark:active:bg-blue-500 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm"
            >
              📊 データ分析
            </Link>
          </div>
        </div>

        {/* Mobile: 人数表示 */}
        <div className="mt-4 sm:hidden">
          <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm">
            {group.members.length}人
          </span>
        </div>

        {/* メンバー一覧 */}
        <div className="mt-4 flex flex-wrap gap-2">
          {group.members.map((member) => (
            <span
              key={member.id}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
            >
              {member.name}
            </span>
          ))}
        </div>

        {/* Mobile: データ分析ボタンと招待ボタン */}
        <div className="mt-4 sm:hidden flex gap-2">
          <button
            type="button"
            onClick={handleCopyInviteLink}
            className="inline-flex items-center justify-center px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-md text-sm font-medium hover:bg-green-700 dark:hover:bg-green-600 active:bg-green-800 dark:active:bg-green-500 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-sm flex-1"
          >
            <LinkIcon className="h-4 w-4 mr-1" />
            {copySuccess ? 'コピー完了!' : '招待リンク'}
          </button>
          <Link
            to={`/groups/${group.id}/analytics`}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 active:bg-blue-800 dark:active:bg-blue-500 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm flex-1"
          >
            📊 データ分析
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-900/20 rounded-lg">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="-mb-px flex" role="tablist" aria-label="グループ情報タブ">
            <button
              type="button"
              onClick={() => setActiveTab('expenses')}
              className={`py-3 px-4 sm:py-4 sm:px-6 border-b-2 font-medium text-sm flex-1 sm:flex-initial cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-all duration-200 active:scale-95 ${
                activeTab === 'expenses'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 active:text-blue-700 dark:active:text-blue-300'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 active:text-gray-800 dark:active:text-gray-200'
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
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 active:text-blue-700 dark:active:text-blue-300'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 active:text-gray-800 dark:active:text-gray-200'
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
                  className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 active:bg-blue-800 dark:active:bg-blue-500 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer transition-all duration-200"
                  aria-label="支払いを追加"
                >
                  支払いを追加
                </button>
              </div>

              {expensesLoading ? (
                <div className="text-center py-8 text-gray-600 dark:text-gray-300">
                  読み込み中...
                </div>
              ) : expensesData?.groupExpenses?.length ? (
                <div className="space-y-4">
                  {expensesData.groupExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                            {expense.description}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {expense.paidByName}が支払い
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formatTimestamp(expense.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-right">
                            <p className="font-semibold text-lg sm:text-base text-gray-900 dark:text-gray-100">
                              ¥{expense.amount.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {expense.splitMembers.length}人で割り勘
                            </p>
                          </div>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => handleEditExpense(expense)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 active:text-blue-800 dark:active:text-blue-200 active:scale-95 text-sm font-medium underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded transition-all duration-200"
                              aria-label={`${expense.description}の支払いを編集`}
                            >
                              編集
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteConfirm(expense.id, expense.description)}
                              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 active:text-red-800 dark:active:text-red-200 active:scale-95 text-sm font-medium underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 rounded transition-all duration-200"
                              aria-label={`${expense.description}の支払いを削除`}
                            >
                              削除
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        <span>割り勘対象: </span>
                        <span>
                          {expense.splitMembers.map((member) => member.memberName).join(', ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  まだ支払い記録がありません。
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  精算方法
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  最小の支払い回数で精算できる方法です
                </p>
              </div>

              {settlementLoading ? (
                <div className="text-center py-8 text-gray-600 dark:text-gray-300">計算中...</div>
              ) : settlementResult?.settlements?.length ? (
                <>
                  <div className="space-y-6">
                    {/* 精算結果 */}
                    <div>
                      <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">
                        📋 精算結果
                      </h4>
                      <div className="space-y-3">
                        {settlementResult.settlements.map((settlement) => (
                          <div
                            key={`${settlement.fromMemberId}-${settlement.toMemberId}`}
                            className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg"
                          >
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {settlement.fromName} → {settlement.toName}
                            </span>
                            <span className="font-bold text-green-700 dark:text-green-300">
                              ¥{settlement.amount.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 計算過程の説明 */}
                    <div>
                      <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">
                        💡 計算過程
                      </h4>
                      <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                        <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
                          {/* Step 1: 1人あたりの負担額 */}
                          <div>
                            <p className="font-medium mb-2">1. 各支払いを1人あたりの負担額に分割</p>
                            <div className="ml-4 space-y-1">
                              {expensesData?.groupExpenses?.map((expense) => (
                                <div
                                  key={expense.id}
                                  className="text-xs bg-white/50 dark:bg-gray-800/50 p-2 rounded"
                                >
                                  <span className="font-medium">{expense.description}</span>: ¥
                                  {expense.amount.toLocaleString()} ÷ {expense.splitMembers.length}
                                  人 = ¥
                                  {Math.round(
                                    expense.amount / expense.splitMembers.length,
                                  ).toLocaleString()}
                                  /人
                                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                    対象: {expense.splitMembers.map((m) => m.memberName).join(', ')}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Step 2: 各メンバーの支払った額と負担すべき額 */}
                          <div>
                            <p className="font-medium mb-2">
                              2. 各メンバーの「支払った額」と「負担すべき額」を計算
                            </p>
                            <div className="ml-4 space-y-1">
                              {settlementResult.balances?.map((balance) => {
                                // 支払った額を計算
                                const paidAmount =
                                  expensesData?.groupExpenses
                                    ?.filter((expense) => expense.paidById === balance.memberId)
                                    .reduce((sum, expense) => sum + expense.amount, 0) || 0;

                                // 負担すべき額を計算
                                const shouldPayAmount =
                                  expensesData?.groupExpenses
                                    ?.filter((expense) =>
                                      expense.splitMembers.some(
                                        (m) => m.memberId === balance.memberId,
                                      ),
                                    )
                                    .reduce(
                                      (sum, expense) =>
                                        sum +
                                        Math.round(expense.amount / expense.splitMembers.length),
                                      0,
                                    ) || 0;

                                return (
                                  <div
                                    key={balance.memberId}
                                    className="text-xs bg-white/50 dark:bg-gray-800/50 p-2 rounded"
                                  >
                                    <span className="font-medium">{balance.memberName}</span>:
                                    支払った額 ¥{paidAmount.toLocaleString()} - 負担すべき額 ¥
                                    {shouldPayAmount.toLocaleString()} =
                                    <span
                                      className={
                                        balance.balance >= 0
                                          ? 'text-green-600 dark:text-green-400'
                                          : 'text-red-600 dark:text-red-400'
                                      }
                                    >
                                      {balance.balance >= 0 ? '+' : ''}¥
                                      {balance.balance.toLocaleString()}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Step 3: 収支の説明 */}
                          <div>
                            <p className="font-medium mb-2">3. 各メンバーの収支を算出</p>
                            <div className="ml-4 text-xs">
                              <p>プラス(+): 受け取る金額（他の人より多く支払っている）</p>
                              <p>マイナス(-): 支払う金額（他の人より少なく支払っている）</p>
                            </div>
                          </div>

                          {/* Step 4: 最適化の説明 */}
                          <div>
                            <p className="font-medium mb-2">
                              4. 最小の送金回数で精算できる組み合わせを計算（Greedy Algorithm）
                            </p>
                            <div className="ml-4 space-y-2">
                              <div className="text-xs">
                                <p className="font-medium mb-1">精算手順:</p>
                                {(() => {
                                  // 精算の手順をシミュレートして表示
                                  if (!settlementResult?.balances) return null;

                                  // 収支をコピーして操作用にする
                                  const balances = settlementResult.balances.map((b) => ({
                                    ...b,
                                    remainingBalance: b.balance,
                                  }));

                                  const steps: Array<{
                                    step: number;
                                    from: string;
                                    to: string;
                                    amount: number;
                                    fromBalance: number;
                                    toBalance: number;
                                    afterFromBalance: number;
                                    afterToBalance: number;
                                  }> = [];

                                  let stepCount = 1;

                                  // Greedy Algorithmのシミュレーション
                                  while (true) {
                                    // 最大債権者（プラス収支が最大）
                                    const maxCreditor = balances
                                      .filter((b) => b.remainingBalance > 0)
                                      .sort((a, b) => b.remainingBalance - a.remainingBalance)[0];

                                    // 最大債務者（マイナス収支が最大）
                                    const maxDebtor = balances
                                      .filter((b) => b.remainingBalance < 0)
                                      .sort((a, b) => a.remainingBalance - b.remainingBalance)[0];

                                    if (!maxCreditor || !maxDebtor) break;

                                    // 送金額を決定（小さい方の絶対値）
                                    const transferAmount = Math.min(
                                      maxCreditor.remainingBalance,
                                      Math.abs(maxDebtor.remainingBalance),
                                    );

                                    // ステップを記録
                                    steps.push({
                                      step: stepCount++,
                                      from: maxDebtor.memberName,
                                      to: maxCreditor.memberName,
                                      amount: transferAmount,
                                      fromBalance: maxDebtor.remainingBalance,
                                      toBalance: maxCreditor.remainingBalance,
                                      afterFromBalance: maxDebtor.remainingBalance + transferAmount,
                                      afterToBalance: maxCreditor.remainingBalance - transferAmount,
                                    });

                                    // 残高を更新
                                    maxDebtor.remainingBalance += transferAmount;
                                    maxCreditor.remainingBalance -= transferAmount;

                                    // 端数処理（1円未満は無視）
                                    if (Math.abs(maxDebtor.remainingBalance) < 1) {
                                      maxDebtor.remainingBalance = 0;
                                    }
                                    if (Math.abs(maxCreditor.remainingBalance) < 1) {
                                      maxCreditor.remainingBalance = 0;
                                    }
                                  }

                                  return (
                                    <div className="space-y-1">
                                      {steps.map((step) => (
                                        <div
                                          key={step.step}
                                          className="bg-white/70 dark:bg-gray-800/70 p-2 rounded text-xs"
                                        >
                                          <div className="font-medium">
                                            Step {step.step}: 最大債権者（{step.to}:{' '}
                                            {step.toBalance >= 0 ? '+' : ''}¥
                                            {step.toBalance.toLocaleString()}）と最大債務者（
                                            {step.from}: ¥{step.fromBalance.toLocaleString()}
                                            ）をペア
                                          </div>
                                          <div className="mt-1">
                                            →{' '}
                                            <span className="font-medium">
                                              {step.from}が{step.to}に¥
                                              {step.amount.toLocaleString()}
                                              支払い
                                            </span>
                                          </div>
                                          <div className="text-blue-600 dark:text-blue-400 text-xs">
                                            結果: {step.to} {step.afterToBalance >= 0 ? '+' : ''}¥
                                            {step.afterToBalance.toLocaleString()}, {step.from} ¥
                                            {step.afterFromBalance.toLocaleString()}
                                          </div>
                                        </div>
                                      ))}
                                      <div className="bg-green-100 dark:bg-green-900 p-2 rounded text-xs font-medium text-green-800 dark:text-green-200">
                                        ✅ 全員の貸し借り残高が0になり精算完了！
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {settlementResult?.balances?.length && (
                    <div className="mt-8">
                      <h4 className="font-semibold mb-4 text-gray-900 dark:text-gray-100">
                        各メンバーの収支
                      </h4>
                      <div className="space-y-2">
                        {settlementResult.balances.map((balance) => (
                          <div
                            key={balance.memberId}
                            className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                          >
                            <span className="text-gray-900 dark:text-gray-100">
                              {balance.memberName}
                            </span>
                            <span
                              className={`font-semibold ${
                                balance.balance > 0
                                  ? 'text-green-600 dark:text-green-400'
                                  : balance.balance < 0
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-gray-600 dark:text-gray-400'
                              }`}
                            >
                              {balance.balance > 0 && '+'}¥{balance.balance.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        ※ 正の値: 受け取る金額、負の値: 支払う金額
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {expensesData?.groupExpenses?.length
                    ? '精算の必要がありません'
                    : '支払い記録がないため精算できません'}
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

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <DeleteConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="支払いを削除"
        message={`「${deleteConfirm.expenseName}」を削除してもよろしいですか？この操作は取り消せません。`}
        onConfirm={handleDeleteExpense}
        onCancel={() => setDeleteConfirm({ isOpen: false, expenseId: null, expenseName: '' })}
      />
    </div>
  );
}
