# warikan-nl-test

自然言語でブラウザテストを記述し Playwright コードへコンパイルするツール。

## 設計思想

事前に**操作対象サービスの React ソースコードを静的解析**して「自然言語 → ロケータ」の解決をコンパイル時に固定する。

```
React ソース (.tsx)
   │  ts-morph で AST 解析（extract.ts）
   ▼
semantic-map.yaml          ← aria-label / label[htmlFor] / placeholder / text / route を抽出
   │  決定的マッチング（compile.ts）
   ▼
*.flow.yaml（自然言語テスト） → *.spec.ts
```

## 使い方

```bash
# 1. 対象サービスのフロントエンドからセマンティックマップを生成
npx tsx src/extract.ts ../warikan/frontend
# 例   → semantic-map.yaml (5 routes / 8 pages / 32 elements)

# 2. Maestro フロー形式のテストをコンパイル
npx tsx src/compile.ts semantic-map.yaml tests/create-group.flow.yaml
# 例   → tests/create-group.spec.ts

# テスト実行
npx playwright test tests/create-group.spec.ts
```

### テスト記述例（tests/create-group.flow.yaml — Maestro フロー形式）

```yaml
page: CreateGroupPage        # Maestro の appId/url に相当。解決スコープ兼初期ルート
use: [ErrorModal]            # 追加スコープ（モーダル等）※本ツール拡張
name: グループを作成して詳細ページに遷移する
---
- launchApp                  # page のルートへ goto
- tapOn: "グループ名"
- inputText: "熱海旅行"        # Maestro 同様、直前に tapOn した要素へ入力
- tapOn: "説明"                # 「説明（任意）」に前方一致で解決
- inputText: "2026年6月の熱海温泉旅行"
- tapOn: "メンバー 1 の名前"    # パラメータ化テンプレートにマッチ
- inputText: "太郎"
- tapOn: "メンバーを追加"
- tapOn: "メンバー 2 の名前"
- inputText: "花子"
- tapOn: "グループを作成"
- assertUrl: /groups/         # ※拡張コマンド
```

サポートコマンド: `launchApp` / `openLink` / `tapOn`（`text` + `index` 指定可）/
`inputText` / `assertVisible` / `assertNotVisible` と、拡張の `selectOption`・`assertUrl`。
`assertVisible` はマップ未登録の任意テキスト（見出し・通知）にも `getByText` で
決定的にフォールバックする。条件分岐テキストのボタン（`{isEdit ? '更新' : '追加'}`）は
`getByRole('button', { name: /更新|追加/ })` にコンパイルされ、どちらの状態でも動く。

### 生成される Playwright コード

```typescript
test('グループを作成して詳細ページに遷移する', async ({ page }) => {
  await page.goto('/groups/new');
  await page.getByLabel('グループ名').fill('熱海旅行');
  await page.getByLabel('説明（任意）').fill('2026年6月の熱海温泉旅行');
  await page.getByLabel('メンバー 1 の名前').fill('太郎');
  await page.getByLabel('新しいメンバーを追加').click();
  await page.getByLabel('メンバー 2 の名前').fill('花子');
  await page.getByLabel('グループを作成して管理ページに移動').click();
  await expect(page).toHaveURL(/\/groups\//);
});
```

## CI への組み込み

1. フロントエンドのソース変更を検知したら `extract.ts` を再実行
2. semantic-map.yaml の差分で「テストに影響する UI 変更」を機械的に検出
3. 全 `.flow.yaml` を再コンパイル → 解決エラーが出たら **テスト実行前に** 壊れた箇所が分かる
   （従来の E2E では実行して timeout するまで分からなかったものが、コンパイルエラーで即座に出る）
