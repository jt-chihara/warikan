import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./pages/HomePage', () => ({
  default: () => <div>Home Page</div>,
}));

vi.mock('./pages/CreateGroupPage', () => ({
  default: () => <div>Create Group Page</div>,
}));

vi.mock('./pages/GroupPage', () => ({
  default: () => <div>Group Page</div>,
}));

vi.mock('./pages/TermsOfServicePage', () => ({
  default: () => <div>Terms Page</div>,
}));

vi.mock('./components/Layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

// App コンポーネントをテスト
describe('App', () => {
  it('renders App component successfully', async () => {
    const App = await import('./App').then((m) => m.default);

    expect(() => render(<App />)).not.toThrow();
  });

  it('exports App component as default', async () => {
    const AppModule = await import('./App');

    expect(AppModule.default).toBeDefined();
    expect(typeof AppModule.default).toBe('function');
  });
});
