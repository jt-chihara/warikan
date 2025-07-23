import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Layout from './Layout';

describe('Layout', () => {
  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
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
    expect(main).toHaveClass('max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'py-8');
  });
});
