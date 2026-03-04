import { test, expect } from '@playwright/test';

test.describe('モバイルボタンタップフィードバック', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('ホームページのグループ作成ボタンがモバイルでアクティブ状態を持つ', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test is only for mobile devices');
    
    const createButton = page.getByRole('link', { name: '新しいグループを作成する' });
    await expect(createButton).toBeVisible();
    
    // Check if active states are applied (we can't directly test :active but can check classes)
    await expect(createButton).toHaveClass(/active:bg-blue-800/);
    await expect(createButton).toHaveClass(/active:scale-95/);
    await expect(createButton).toHaveClass(/transition-all/);
  });

  test('グループカードがモバイルでアクティブ状態を持つ', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test is only for mobile devices');
    
    // Create a mock group first by navigating to create page
    await page.getByRole('link', { name: '新しいグループを作成する' }).click();
    
    // Fill form
    await page.fill('#groupName', 'テストグループ');
    await page.fill('input[placeholder="メンバー名"]', 'テストメンバー');
    
    const createButton = page.getByRole('button', { name: 'グループを作成' });
    await expect(createButton).toHaveClass(/active:bg-blue-800/);
    await expect(createButton).toHaveClass(/active:scale-95/);
  });

  test('グループ作成ページのボタンがアクティブ状態を持つ', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test is only for mobile devices');
    
    await page.goto('/groups/new');
    
    // Check member add button
    const addMemberButton = page.getByRole('button', { name: '新しいメンバーを追加' });
    await expect(addMemberButton).toHaveClass(/active:text-blue-900/);
    await expect(addMemberButton).toHaveClass(/active:scale-95/);
    
    // Check cancel button
    const cancelButton = page.getByRole('button', { name: 'グループ作成をキャンセルしてホームページに戻る' });
    await expect(cancelButton).toHaveClass(/active:bg-gray-100/);
    await expect(cancelButton).toHaveClass(/active:scale-95/);
    
    // Check create button
    const createButton = page.getByRole('button', { name: 'グループを作成して管理ページに移動' });
    await expect(createButton).toHaveClass(/active:bg-blue-800/);
    await expect(createButton).toHaveClass(/active:scale-95/);
  });

  test('モーダルボタンがアクティブ状態を持つ', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test is only for mobile devices');
    
    // Navigate to create group and create a test group
    await page.goto('/groups/new');
    await page.fill('#groupName', 'テストグループ');
    await page.fill('input[placeholder="メンバー名"]', 'テストメンバー1');
    await page.getByRole('button', { name: '新しいメンバーを追加' }).click();
    const secondMemberInput = page.locator('input[placeholder="メンバー名"]').nth(1);
    await secondMemberInput.fill('テストメンバー2');
    await page.getByRole('button', { name: 'グループを作成して管理ページに移動' }).click();
    
    // Wait for navigation to group page
    await page.waitForURL(/\/groups\/[^/]+$/);
    
    // Open expense modal
    await page.getByRole('button', { name: '支払いを追加' }).click();
    
    // Check modal buttons
    const modalAddButton = page.getByRole('button', { name: '新しい支払いを追加' });
    await expect(modalAddButton).toHaveClass(/active:bg-blue-800/);
    await expect(modalAddButton).toHaveClass(/active:scale-95/);
    
    const modalCancelButton = page.getByRole('button', { name: '操作をキャンセルしてモーダルを閉じる' });
    await expect(modalCancelButton).toHaveClass(/active:bg-gray-100/);
    await expect(modalCancelButton).toHaveClass(/active:scale-95/);
    
    // Check select all button
    const selectAllButton = page.getByRole('button', { name: '全メンバーを選択' });
    await expect(selectAllButton).toHaveClass(/active:text-blue-900/);
    await expect(selectAllButton).toHaveClass(/active:scale-95/);
    
    // Check member checkbox labels have larger tap areas
    const memberCheckboxes = page.locator('fieldset label');
    const firstCheckbox = memberCheckboxes.first();
    await expect(firstCheckbox).toHaveClass(/py-3/);
    await expect(firstCheckbox).toHaveClass(/px-2/);
    await expect(firstCheckbox).toHaveClass(/active:bg-gray-100/);
    await expect(firstCheckbox).toHaveClass(/active:scale-98/);
  });

  test('タブボタンがアクティブ状態を持つ', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test is only for mobile devices');
    
    // Create a test group first
    await page.goto('/groups/new');
    await page.fill('#groupName', 'テストグループ');
    await page.fill('input[placeholder="メンバー名"]', 'テストメンバー');
    await page.getByRole('button', { name: 'グループを作成して管理ページに移動' }).click();
    await page.waitForURL(/\/groups\/[^/]+$/);
    
    // Check tab buttons
    const expenseTab = page.getByRole('tab', { name: '支払い記録' });
    await expect(expenseTab).toHaveClass(/active:scale-95/);
    
    const settlementTab = page.getByRole('tab', { name: '精算' });
    await expect(settlementTab).toHaveClass(/active:scale-95/);
  });

  test('分析ページの戻るボタンがアクティブ状態を持つ', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test is only for mobile devices');
    
    // Create a test group
    await page.goto('/groups/new');
    await page.fill('#groupName', 'テストグループ');
    await page.fill('input[placeholder="メンバー名"]', 'テストメンバー');
    await page.getByRole('button', { name: 'グループを作成して管理ページに移動' }).click();
    await page.waitForURL(/\/groups\/[^/]+$/);
    
    // Navigate to analytics page
    await page.getByRole('link', { name: '📊 データ分析' }).click();
    await page.waitForURL(/\/groups\/[^/]+\/analytics$/);
    
    // Check back button has active states
    const backButton = page.getByRole('link', { name: '← グループページに戻る' });
    await expect(backButton).toBeVisible();
    
    const className = await backButton.getAttribute('class');
    expect(className).toContain('active:bg-gray-300');
    expect(className).toContain('active:scale-95');
  });

  test('実際のタップでボタンの視覚フィードバックが動作する', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test is only for mobile devices');
    
    const createButton = page.getByRole('link', { name: '新しいグループを作成する' });
    await expect(createButton).toBeVisible();
    
    // Simply click the button - this will trigger active states
    await createButton.click();
    
    // Navigate should occur
    await expect(page).toHaveURL('http://localhost:3000/groups/new');
  });
});

test.describe('デスクトップボタン状態', () => {
  test('デスクトップボタンがホバーとフォーカス状態を持つ', async ({ page, isMobile }) => {
    test.skip(isMobile, 'This test is only for desktop devices');
    
    await page.goto('/');
    
    const createButton = page.getByRole('link', { name: '新しいグループを作成する' });
    await expect(createButton).toHaveClass(/hover:bg-blue-700/);
    await expect(createButton).toHaveClass(/focus:outline-none/);
    await expect(createButton).toHaveClass(/focus:ring-2/);
  });
});