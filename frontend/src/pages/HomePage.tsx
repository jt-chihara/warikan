import { Link } from 'react-router-dom';
import { useLocalGroups } from '../hooks/useLocalGroups';
import { formatTimestamp } from '../lib/dateUtils';

export default function HomePage() {
  const { groups } = useLocalGroups();
  return (
    <div>
      <div className="text-center py-12">
        <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          簡単に割り勘計算
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          旅行や飲み会の支払いを記録して、最適な精算方法を計算します
        </p>
        <Link
          to="/groups/new"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
          aria-label="新しいグループを作成する"
        >
          グループを作成する
        </Link>
      </div>

      {groups.length > 0 && (
        <div className="mt-12">
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
            最近のグループ
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.slice(0, groups.length).map((group) => (
              <Link
                key={group.id}
                to={`/groups/${group.id}`}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-gray-900/20 hover:shadow-md dark:hover:shadow-gray-900/30 active:shadow-lg dark:active:shadow-gray-900/40 active:scale-98 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label={`${group.name}グループの詳細を表示`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {group.name}
                  </h4>
                  <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                    {group.members.length}人
                  </span>
                </div>
                {group.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2">
                    {group.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>通貨: {group.currency}</span>
                  <span>{formatTimestamp(group.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <section className="mt-16" aria-label="アプリの特徴">
        <h2 className="sr-only">アプリの特徴一覧</h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-gray-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              会員登録不要
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              アプリのインストールや会員登録は不要。ブラウザですぐに使えます。
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-gray-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              最適な精算方法
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              独自アルゴリズムで支払い回数を最小限に抑えた精算方法を提案します。
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-gray-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              柔軟な計算
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              途中参加や個別精算など、様々なパターンに対応できます。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
