import { defineConfig } from '@playwright/test';

/**
 * warikan 向け Playwright 設定。
 * - docker compose up 時: フロントエンドは http://localhost:3000
 * - frontend/ で npm run dev 時: Vite デフォルトの http://localhost:5173
 * 環境変数 BASE_URL で上書き可能。
 *   BASE_URL=http://localhost:5173 npx playwright test
 */
export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3001',
    trace: 'on-first-retry',
  },
});
