import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DarkModeProvider } from '../contexts/DarkModeContext';
import Layout from './Layout';

describe('Layout', () => {
  beforeEach(() => {
    // LocalStorageのモック
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
      },
      writable: true,
    });

    // matchMediaのモック
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
      writable: true,
    });
  });

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(
      <DarkModeProvider>
        <BrowserRouter>{ui}</BrowserRouter>
      </DarkModeProvider>,
    );
  };

  it('renders navigation with app title', () => {
    renderWithRouter(
      <Layout>
        <div>Test Content</div>
      </Layout>,
    );

    expect(screen.getByText('割り勘アプリ')).toBeInTheDocument();
  });

  it('renders new group link', () => {
    renderWithRouter(
      <Layout>
        <div>Test Content</div>
      </Layout>,
    );

    // デスクトップビュー
    expect(screen.getByText('新しいグループ')).toBeInTheDocument();
    // モバイルビュー
    expect(screen.getByText('新規')).toBeInTheDocument();
  });

  it('renders children content', () => {
    renderWithRouter(
      <Layout>
        <div data-testid="child-content">Test Child Content</div>
      </Layout>,
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Test Child Content')).toBeInTheDocument();
  });

  it('has correct navigation links', () => {
    renderWithRouter(
      <Layout>
        <div>Test Content</div>
      </Layout>,
    );

    const homeLink = screen.getByRole('link', { name: /割り勘アプリ/i });
    expect(homeLink).toHaveAttribute('href', '/');

    const newGroupLinks = screen.getAllByRole('link', { name: /新しいグループ|新規/i });
    newGroupLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/groups/new');
    });
  });

  it('applies responsive classes correctly', () => {
    const { container } = renderWithRouter(
      <Layout>
        <div>Test Content</div>
      </Layout>,
    );

    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('bg-white', 'shadow');

    const main = container.querySelector('main');
    expect(main).toHaveClass(
      'flex-1',
      'max-w-7xl',
      'mx-auto',
      'px-4',
      'sm:px-6',
      'lg:px-8',
      'pt-4',
      'pb-8',
      'w-full',
    );
  });

  it('renders dark mode toggle button', () => {
    renderWithRouter(
      <Layout>
        <div>Test Content</div>
      </Layout>,
    );

    const toggleButton = screen.getByRole('button', { name: /ダークモードに切り替え/i });
    expect(toggleButton).toBeInTheDocument();
  });
});
