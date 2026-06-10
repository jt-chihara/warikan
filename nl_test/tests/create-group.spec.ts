// 自動生成: グループを作成して詳細ページに遷移する
// generator: warikan-nl-test / source map: semantic-map.yaml (2026-06-10T12:57:49.162Z)
// このファイルは決定的に再生成可能です。直接編集せず .flow.yaml を編集してください。
import { expect, test } from '@playwright/test';

test('グループを作成して詳細ページに遷移する', async ({ page }) => {
  await page.goto('/groups/new'); // launchApp → CreateGroupPage
  await page.getByLabel('グループ名').click(); // tapOn: グループ名
  await page.getByLabel('グループ名').fill('熱海旅行'); // inputText → グループ名
  await page.getByLabel('説明（任意）').click(); // tapOn: 説明
  await page.getByLabel('説明（任意）').fill('2026年6月の熱海温泉旅行'); // inputText → 説明
  await page.getByLabel('メンバー 1 の名前').click(); // tapOn: メンバー 1 の名前
  await page.getByLabel('メンバー 1 の名前').fill('太郎'); // inputText → メンバー 1 の名前
  await page.getByLabel('新しいメンバーを追加').click(); // tapOn: メンバーを追加
  await page.getByLabel('メンバー 2 の名前').click(); // tapOn: メンバー 2 の名前
  await page.getByLabel('メンバー 2 の名前').fill('花子'); // inputText → メンバー 2 の名前
  await page.getByLabel('グループを作成して管理ページに移動').click(); // tapOn: グループを作成
  await expect(page).toHaveURL(/\/groups\//);
});
