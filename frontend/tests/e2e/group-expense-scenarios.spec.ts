import { test, expect } from '@playwright/test';

test.describe('グループと支払い管理シナリオ', () => {
  test.describe('モバイルシナリオ', () => {
    test('完全なワークフロー: グループ作成、支払い追加、支払い編集、支払い削除（モバイル）', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');
      
      // テスト用データ
      const groupName = 'テスト旅行';
      const groupDescription = '2024年冬の温泉旅行';
      const members = ['田中太郎', '佐藤花子', '山田次郎'];
      
      // ========== グループ作成 ==========
      await page.goto('/');
      await page.getByRole('link', { name: '新しいグループを作成する' }).click();
      await expect(page).toHaveURL('/groups/new');
      
      // グループ名入力
      await page.fill('#groupName', groupName);
      
      // 説明入力
      await page.fill('#description', groupDescription);
      
      // メンバー1を入力
      await page.fill('input[placeholder="メンバー名"]', members[0]);
      
      // メンバー2を追加
      await page.getByRole('button', { name: '新しいメンバーを追加' }).click();
      const secondMemberInput = page.locator('input[placeholder="メンバー名"]').nth(1);
      await secondMemberInput.fill(members[1]);
      
      // メンバー3を追加
      await page.getByRole('button', { name: '新しいメンバーを追加' }).click();
      const thirdMemberInput = page.locator('input[placeholder="メンバー名"]').nth(2);
      await thirdMemberInput.fill(members[2]);
      
      // グループ作成
      await page.getByRole('button', { name: 'グループを作成して管理ページに移動' }).click();
      
      // グループページに遷移することを確認
      await page.waitForURL(/\/groups\/[^/]+$/);
      
      // 作成されたグループの内容を確認
      await expect(page.getByRole('heading', { name: groupName })).toBeVisible();
      await expect(page.getByText(groupDescription)).toBeVisible();
      // 人数が正しく表示されていることを確認（表示されている方をチェック）
      const memberCountVisible = page.locator('span').filter({ hasText: /^3人$/ }).locator('visible=true').first();
      await expect(memberCountVisible).toBeVisible();
      
      // 全メンバーが表示されていることを確認
      for (const member of members) {
        await expect(page.getByText(member)).toBeVisible();
      }
      
      // ========== 支払い追加 ==========
      await page.getByRole('button', { name: '支払いを追加' }).click();
      
      // モーダルが開くことを確認
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('heading', { name: '支払いを追加' })).toBeVisible();
      
      // 支払い情報を入力
      await page.fill('#amount', '5000');
      await page.fill('#description', '夕食代');
      await page.selectOption('#paidBy', { label: members[0] }); // 田中太郎が支払い
      
      // 全員を割り勘対象に選択
      await page.getByRole('button', { name: '全メンバーを選択' }).click();
      
      // 支払い追加を実行
      await page.getByRole('button', { name: '新しい支払いを追加' }).click();
      
      // モーダルが閉じることを確認
      await expect(page.getByRole('dialog')).not.toBeVisible();
      
      // 追加された支払いが表示されることを確認
      await expect(page.getByText('夕食代')).toBeVisible();
      await expect(page.getByText('¥5,000')).toBeVisible();
      await expect(page.getByText(`${members[0]}が支払い`)).toBeVisible();
      await expect(page.getByText('3人で割り勘')).toBeVisible();
      
      // ========== 支払い編集 ==========
      // 編集ボタンをクリック
      await page.getByRole('button', { name: '夕食代の支払いを編集' }).click();
      
      // 編集モーダルが開くことを確認
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('heading', { name: '支払いを編集' })).toBeVisible();
      
      // 既存の値が入力されていることを確認
      await expect(page.locator('#amount')).toHaveValue('5000');
      await expect(page.locator('#description')).toHaveValue('夕食代');
      
      // 金額と説明を変更
      await page.fill('#amount', '6000');
      await page.fill('#description', '夕食代（飲み物込み）');
      
      // 更新を実行
      await page.getByRole('button', { name: '支払い情報を更新' }).click();
      
      // モーダルが閉じることを確認
      await expect(page.getByRole('dialog')).not.toBeVisible();
      
      // 更新された支払いが表示されることを確認
      await expect(page.getByText('夕食代（飲み物込み）')).toBeVisible();
      await expect(page.getByText('¥6,000')).toBeVisible();
      
      // ========== 支払い削除 ==========
      // 削除ボタンをクリック
      await page.getByRole('button', { name: '夕食代（飲み物込み）の支払いを削除' }).click();
      
      // 確認ダイアログが表示されるので、OKをクリック
      page.on('dialog', dialog => dialog.accept());
      
      // 支払いが削除されたことを確認
      await expect(page.getByText('夕食代（飲み物込み）')).not.toBeVisible();
      await expect(page.getByText('まだ支払い記録がありません。')).toBeVisible();
    });
  });

  test.describe('デスクトップシナリオ', () => {
    test('完全なワークフロー: グループ作成、支払い追加、支払い編集、支払い削除（デスクトップ）', async ({ page, isMobile }) => {
      test.skip(isMobile, 'This test is only for desktop devices');
      
      // テスト用データ
      const groupName = 'デスクトップテスト';
      const groupDescription = '2024年春の合宿';
      const members = ['鈴木一郎', '高橋美咲', '伊藤健太'];
      
      // ========== グループ作成 ==========
      await page.goto('/');
      await page.getByRole('link', { name: '新しいグループを作成する' }).click();
      await expect(page).toHaveURL('/groups/new');
      
      // グループ名入力
      await page.fill('#groupName', groupName);
      
      // 説明入力
      await page.fill('#description', groupDescription);
      
      // メンバー1を入力
      await page.fill('input[placeholder="メンバー名"]', members[0]);
      
      // メンバー2を追加
      await page.getByRole('button', { name: '新しいメンバーを追加' }).click();
      const secondMemberInput = page.locator('input[placeholder="メンバー名"]').nth(1);
      await secondMemberInput.fill(members[1]);
      
      // メンバー3を追加
      await page.getByRole('button', { name: '新しいメンバーを追加' }).click();
      const thirdMemberInput = page.locator('input[placeholder="メンバー名"]').nth(2);
      await thirdMemberInput.fill(members[2]);
      
      // グループ作成
      await page.getByRole('button', { name: 'グループを作成して管理ページに移動' }).click();
      
      // グループページに遷移することを確認
      await page.waitForURL(/\/groups\/[^/]+$/);
      
      // 作成されたグループの内容を確認
      await expect(page.getByRole('heading', { name: groupName })).toBeVisible();
      await expect(page.getByText(groupDescription)).toBeVisible();
      // 人数が正しく表示されていることを確認（表示されている方をチェック）
      const memberCountVisible = page.locator('span').filter({ hasText: /^3人$/ }).locator('visible=true').first();
      await expect(memberCountVisible).toBeVisible();
      
      // 全メンバーが表示されていることを確認
      for (const member of members) {
        await expect(page.getByText(member)).toBeVisible();
      }
      
      // ========== 支払い追加 ==========
      await page.getByRole('button', { name: '支払いを追加' }).click();
      
      // モーダルが開くことを確認
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('heading', { name: '支払いを追加' })).toBeVisible();
      
      // 支払い情報を入力
      await page.fill('#amount', '12000');
      await page.fill('#description', '宿泊費');
      await page.selectOption('#paidBy', { label: members[1] }); // 高橋美咲が支払い
      
      // 割り勘対象を個別に選択（最初の2人のみ）
      const memberCheckboxes = page.locator('fieldset label');
      await memberCheckboxes.nth(0).click(); // 1人目
      await memberCheckboxes.nth(1).click(); // 2人目
      
      // 支払い追加を実行
      await page.getByRole('button', { name: '新しい支払いを追加' }).click();
      
      // モーダルが閉じることを確認
      await expect(page.getByRole('dialog')).not.toBeVisible();
      
      // 追加された支払いが表示されることを確認
      await expect(page.getByText('宿泊費')).toBeVisible();
      await expect(page.getByText('¥12,000')).toBeVisible();
      await expect(page.getByText(`${members[1]}が支払い`)).toBeVisible();
      await expect(page.getByText('2人で割り勘')).toBeVisible();
      
      // ========== 支払い編集 ==========
      // 編集ボタンをクリック
      await page.getByRole('button', { name: '宿泊費の支払いを編集' }).click();
      
      // 編集モーダルが開くことを確認
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('heading', { name: '支払いを編集' })).toBeVisible();
      
      // 既存の値が入力されていることを確認
      await expect(page.locator('#amount')).toHaveValue('12000');
      await expect(page.locator('#description')).toHaveValue('宿泊費');
      
      // 金額を変更し、全員を割り勘対象にする
      await page.fill('#amount', '15000');
      await page.fill('#description', '宿泊費（朝食付き）');
      
      // 全選択ボタンで全員を対象に
      await page.getByRole('button', { name: '全メンバーを選択' }).click();
      
      // 更新を実行
      await page.getByRole('button', { name: '支払い情報を更新' }).click();
      
      // モーダルが閉じることを確認
      await expect(page.getByRole('dialog')).not.toBeVisible();
      
      // 更新された支払いが表示されることを確認
      await expect(page.getByText('宿泊費（朝食付き）')).toBeVisible();
      await expect(page.getByText('¥15,000')).toBeVisible();
      await expect(page.getByText('3人で割り勘')).toBeVisible();
      
      // ========== 支払い削除 ==========
      // 削除ボタンをクリック
      await page.getByRole('button', { name: '宿泊費（朝食付き）の支払いを削除' }).click();
      
      // 確認ダイアログが表示されるので、OKをクリック
      page.on('dialog', dialog => dialog.accept());
      
      // 支払いが削除されたことを確認
      await expect(page.getByText('宿泊費（朝食付き）')).not.toBeVisible();
      await expect(page.getByText('まだ支払い記録がありません。')).toBeVisible();
    });
  });

  test.describe('クロスデバイス機能', () => {
    test('分析ページのナビゲーションがモバイルとデスクトップの両方で動作する', async ({ page }) => {
      // グループを作成
      await page.goto('/groups/new');
      await page.fill('#groupName', 'Analytics Test');
      await page.fill('input[placeholder="メンバー名"]', 'Test User');
      await page.getByRole('button', { name: 'グループを作成して管理ページに移動' }).click();
      
      await page.waitForURL(/\/groups\/[^/]+$/);
      
      // データ分析ボタンをクリック
      await page.getByRole('link', { name: '📊 データ分析' }).click();
      
      // 分析ページに遷移することを確認
      await page.waitForURL(/\/groups\/[^/]+\/analytics$/);
      await expect(page.getByRole('heading', { name: '📊 データ分析' })).toBeVisible();
      
      // 戻るボタンで元のページに戻る
      await page.getByRole('link', { name: '← グループページに戻る' }).click();
      await page.waitForURL(/\/groups\/[^/]+$/);
      await expect(page.getByRole('heading', { name: 'Analytics Test' })).toBeVisible();
    });

    test('タブナビゲーションが正しく動作する', async ({ page }) => {
      // グループを作成
      await page.goto('/groups/new');
      await page.fill('#groupName', 'Tab Test');
      await page.fill('input[placeholder="メンバー名"]', 'Test User');
      await page.getByRole('button', { name: 'グループを作成して管理ページに移動' }).click();
      
      await page.waitForURL(/\/groups\/[^/]+$/);
      
      // 支払い記録タブがアクティブであることを確認
      const expenseTab = page.getByRole('tab', { name: '支払い記録' });
      const settlementTab = page.getByRole('tab', { name: '精算' });
      
      await expect(expenseTab).toHaveAttribute('aria-selected', 'true');
      
      // 精算タブに切り替え
      await settlementTab.click();
      await expect(settlementTab).toHaveAttribute('aria-selected', 'true');
      await expect(page.getByText('支払い記録がないため精算できません')).toBeVisible();
      
      // 支払い記録タブに戻る
      await expenseTab.click();
      await expect(expenseTab).toHaveAttribute('aria-selected', 'true');
      await expect(page.getByText('まだ支払い記録がありません。')).toBeVisible();
    });
  });
});