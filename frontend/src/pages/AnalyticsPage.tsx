import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ExpenseLineChart from '../components/charts/ExpenseLineChart';
import MemberPieChart from '../components/charts/MemberPieChart';
import MonthlyBarChart from '../components/charts/MonthlyBarChart';
import { useGroupExpenses } from '../hooks/useExpense';
import { useGroup } from '../hooks/useGroup';
import {
  aggregateExpensesByDay,
  aggregateExpensesByMember,
  aggregateExpensesByMonth,
} from '../utils/chartUtils';
import { timestampToDate } from '../utils/timestampUtils';

type ChartType = 'daily' | 'monthly' | 'members';

export default function AnalyticsPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const [activeChart, setActiveChart] = useState<ChartType>('daily');

  // キーボードナビゲーション用のハンドラー
  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    const tabs = ['daily', 'monthly', 'members'] as const;
    let newIndex = currentIndex;

    if (e.key === 'ArrowRight') {
      newIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      newIndex = 0;
    } else if (e.key === 'End') {
      newIndex = tabs.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    setActiveChart(tabs[newIndex]);
    // フォーカスを新しいタブに移動
    setTimeout(() => {
      document.getElementById(`${tabs[newIndex]}-tab`)?.focus();
    }, 0);
  };

  const { data: groupData, loading: groupLoading, error: groupError } = useGroup(groupId || '');
  const { data: expensesData, loading: expensesLoading } = useGroupExpenses(groupId || '');

  if (groupLoading || expensesLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (groupError) {
    const isGroupNotFound =
      groupError.message.includes('sql: no rows in result set') ||
      groupError.message.includes('not found');
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-red-600">
          {isGroupNotFound
            ? 'そのグループは存在しません。'
            : `エラーが発生しました: ${groupError.message}`}
        </div>
      </div>
    );
  }

  const group = groupData?.group;
  const expenses = expensesData?.groupExpenses || [];

  // デバッグ: データ取得状況を確認
  console.log('Analytics Page Debug:', {
    groupId,
    groupData,
    expensesData,
    expensesLength: expenses.length,
    group: group,
  });

  if (!group) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-gray-600">グループが見つかりません。</div>
      </div>
    );
  }

  // データ集計
  const dailyData = aggregateExpensesByDay(expenses);
  const monthlyData = aggregateExpensesByMonth(expenses);
  const memberData = aggregateExpensesByMember(expenses, group.members);

  // デバッグ: 最初の数件のexpenseの日付形式を確認
  if (expenses.length > 0) {
    console.log(
      'Sample expense dates:',
      expenses.slice(0, 3).map((e) => ({
        id: e.id,
        createdAt: e.createdAt,
        parsed: timestampToDate(e.createdAt),
        isValid: !Number.isNaN(timestampToDate(e.createdAt).getTime()),
      })),
    );
  }

  const chartTabs = [
    { key: 'daily' as const, label: '日別推移', count: dailyData.length },
    { key: 'monthly' as const, label: '月別推移', count: monthlyData.length },
    { key: 'members' as const, label: 'メンバー別', count: memberData.length },
  ];

  const renderChart = () => {
    switch (activeChart) {
      case 'daily':
        return <ExpenseLineChart data={dailyData} currency={group.currency} />;
      case 'monthly':
        return <MonthlyBarChart data={monthlyData} currency={group.currency} />;
      case 'members':
        return <MemberPieChart data={memberData} currency={group.currency} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">📊 データ分析</h1>
          <Link
            to={`/groups/${group.id}`}
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
          >
            ← グループページに戻る
          </Link>
        </div>
        <div className="flex items-center space-x-2 text-gray-600">
          <span className="text-lg font-medium">{group.name}</span>
          <span>•</span>
          <span>{expenses.length}件の支払い記録</span>
        </div>
        {group.description && <p className="text-gray-600 mt-1">{group.description}</p>}
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">まだ支払い記録がありません</div>
          <p className="text-gray-400">
            グループページで支払いを追加すると、ここにグラフが表示されます。
          </p>
        </div>
      ) : (
        <>
          {/* タブナビゲーション */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8" aria-label="グラフタブ">
                {chartTabs.map((tab, index) => (
                  <button
                    type="button"
                    key={tab.key}
                    id={`${tab.key}-tab`}
                    onClick={() => setActiveChart(tab.key)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      activeChart === tab.key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    aria-current={activeChart === tab.key ? 'page' : undefined}
                    aria-label={`${tab.label}を表示`}
                    role="tab"
                    aria-selected={activeChart === tab.key}
                    tabIndex={activeChart === tab.key ? 0 : -1}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span
                        className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                          activeChart === tab.key
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* グラフ表示エリア */}
          <div
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            role="tabpanel"
            aria-labelledby={`${activeChart}-tab`}
          >
            {renderChart()}
          </div>

          {/* 概要統計 */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-500 font-medium">総支払い額</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {new Intl.NumberFormat('ja-JP', {
                  style: 'currency',
                  currency: group.currency,
                  minimumFractionDigits: 0,
                }).format(expenses.reduce((sum: number, expense) => sum + expense.amount, 0))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-500 font-medium">平均支払い額</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {new Intl.NumberFormat('ja-JP', {
                  style: 'currency',
                  currency: group.currency,
                  minimumFractionDigits: 0,
                }).format(
                  expenses.reduce((sum: number, expense) => sum + expense.amount, 0) /
                    Math.max(expenses.length, 1),
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-500 font-medium">支払い件数</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{expenses.length}件</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-500 font-medium">参加メンバー</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{group.members.length}人</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
