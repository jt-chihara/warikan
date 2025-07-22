import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div>
      <div className="text-center py-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">簡単に割り勘計算</h2>
        <p className="text-xl text-gray-600 mb-8">
          旅行や飲み会の支払いを記録して、最適な精算方法を計算します
        </p>
        <Link
          to="/groups/new"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          グループを作成する
        </Link>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">会員登録不要</h3>
          <p className="text-gray-600">
            アプリのインストールや会員登録は不要。ブラウザですぐに使えます。
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">最適な精算方法</h3>
          <p className="text-gray-600">
            独自アルゴリズムで支払い回数を最小限に抑えた精算方法を提案します。
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">柔軟な計算</h3>
          <p className="text-gray-600">途中参加や個別精算など、様々なパターンに対応できます。</p>
        </div>
      </div>
    </div>
  );
}