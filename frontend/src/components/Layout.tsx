import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link
                to="/"
                className="flex items-center px-2 py-2 text-gray-900 hover:text-gray-700"
              >
                <h1 className="text-lg sm:text-xl font-bold">割り勘アプリ</h1>
              </Link>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link
                to="/groups/new"
                className="bg-blue-600 text-white px-3 py-2 sm:px-4 rounded-md text-sm font-medium hover:bg-blue-700 active:bg-blue-800 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 cursor-pointer"
              >
                <span className="hidden sm:inline">新しいグループ</span>
                <span className="sm:hidden">新規</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8 w-full">
        {children}
      </main>
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col items-center space-y-2">
            <div className="flex items-center space-x-4">
              <Link to="/terms" className="text-sm text-gray-500 hover:text-gray-700">
                利用規約
              </Link>
            </div>
            <p className="text-sm text-gray-500">© jt-chihara</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
