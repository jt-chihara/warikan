# 割り勘アプリ (Warikan App)

グループでの支払いを記録し、最適な精算方法を計算する割り勘アプリケーションです。

## 🏗️ アーキテクチャ
- **フロントエンド**: React + TypeScript + Vite + TailwindCSS v4
- **バックエンド**: REST API (Rust/Axum)
- **データベース**: PostgreSQL 17（Rust REST API は PostgreSQL 接続＋sqlx migrations）
- **開発環境**: Docker Compose
- **テスト**: Vitest (フロントエンド)
- **Lint/Format**: Biome (フロントエンド)

## 🚀 開発環境の構築

### 前提条件

- Docker Desktop がインストールされていること
- Git がインストールされていること

### セットアップ手順

1. **リポジトリをクローン**
   ```bash
   git clone git@github.com:jt-chihara/warikan.git
   cd warikan
   ```

2. **環境変数ファイルを設定**
   ```bash
   cp .env.example .env
   ```

3. **Docker Composeでサービスを起動**
   ```bash
   docker compose up --build
   ```

### 🔗 アクセスURL

起動後、以下のURLでアクセスできます：

- **フロントエンド**: http://localhost:3000
- **バックエンド（REST）**: http://localhost:8080 （OpenAPI: `backend/openapi.yaml`）
- **データベース**: localhost:5432

## ✨ 主な機能

- **グループ管理**: グループ作成・編集・削除
- **メンバー管理**: グループメンバーの追加・削除
- **支払い記録**: 個人が立て替えた支払いの記録
- **精算計算**: 最適な精算方法の自動計算
- **データ可視化**: 支払い履歴のグラフ表示（日別・月別・メンバー別）
- **レスポンシブUI**: モバイル・デスクトップ対応
- **利用規約**: サービス利用規約の表示

## 📁 プロジェクト構造

```
warikan/
├── frontend/                 # React フロントエンド
│   ├── src/
│   │   ├── components/      # UIコンポーネント
│   │   ├── pages/           # ページコンポーネント
│   │   ├── hooks/           # カスタムフック
│   │   ├── types/           # TypeScript型定義
│   │   └── lib/             # ライブラリ設定
│   ├── Dockerfile
│   └── package.json
├── backend/                 # Rust REST バックエンド（Axum）
│   ├── src/
│   │   └── main.rs
│   ├── Cargo.toml
│   ├── Dockerfile
│   └── openapi.yaml
├── docker-compose.yml       # Docker Compose設定
└── README.md
```

## 🛠️ 開発コマンド

### 全サービスの管理

```bash
# サービス起動 (初回 / Dockerfileに変更があった場合)
docker compose up --build

# サービス起動 (通常)
docker compose up

# バックグラウンドで起動
docker compose up -d

# サービス停止
docker compose down

# ボリュームも含めて完全削除
docker compose down -v
```

### 個別サービスの管理

```bash
# 特定のサービスのみ起動
docker compose up frontend
docker compose up backend
docker compose up db

# サービスの再起動
docker compose restart frontend

# サービスのログ確認
docker compose logs -f frontend
docker compose logs -f backend
```

### デバッグ・開発作業

```bash
# コンテナ内でシェルを実行
docker compose exec frontend sh
docker compose exec backend sh

# データベースに接続
docker compose exec db psql -U warikan -d warikan
```

## 🧪 テスト実行

### フロントエンドテスト

```bash
# コンテナ内でテスト実行
docker compose exec frontend npm test

# CI用テスト実行（1回のみ）
docker compose exec frontend npm run test:ci

# Lintチェック
docker compose exec frontend npm run lint:ci

# Lint自動修正
docker compose exec frontend npm run lint

# ホストマシンでテスト実行（node_modulesが必要）
cd frontend
npm test
```



## 🔄 開発ワークフロー

### フロントエンド開発

1. コードを編集すると自動でホットリロードされます
2. `http://localhost:3000` でリアルタイムに変更を確認
3. API は REST (`http://localhost:8080`) に送信されます
   - `.env` で `VITE_API_MODE=rest` と `VITE_REST_ENDPOINT=http://localhost:8080` を設定済み
4. TailwindCSS v4 を使用した CSS-first 設定

### バックエンド開発

1. Rust のコードを編集すると再ビルドが必要です
2. REST API は `localhost:8080` で起動（`backend` サービス）

### データベース / マイグレーション（sqlx）

```bash
# sqlx-cli のインストール
cargo install sqlx-cli --no-default-features --features postgres,rustls --locked

# 環境変数（例: .env も利用可）
export DATABASE_URL=postgres://warikan:warikan_dev_password@localhost:5432/warikan

# マイグレーション適用
cd backend
sqlx migrate run

# 新しいマイグレーションの作成（例）
sqlx migrate add 20240902_add_indexes

# DBに接続（psql）
docker compose exec db psql -U warikan -d warikan
```

## 🐛 トラブルシューティング

### ポート衝突エラー

既に使用されているポートがある場合は、`docker-compose.yml` でポート番号を変更してください。

```yaml
ports:
  - "3001:3000"  # フロントエンドを3001番ポートに変更
```

### データベース接続エラー

```bash
# データベースコンテナの状態確認
docker compose ps db

# データベースログ確認
docker compose logs db

# データベースのヘルスチェック
docker compose exec db pg_isready -U warikan -d warikan
```

### コンテナビルドエラー

```bash
# キャッシュをクリアして再ビルド
docker compose build --no-cache

# 未使用のイメージ・コンテナを削除
docker system prune -f
```

### node_modules の問題

```bash
# フロントエンドの依存関係を再インストール
docker compose exec frontend npm ci

# または、ボリュームを削除して再起動
docker compose down -v
docker compose up --build
```

## 📊 モニタリング

### ログの確認

```bash
# 全サービスのログ
docker compose logs -f

# 特定のサービスのログ
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f db
```

### リソース使用量

```bash
# コンテナのリソース使用量
docker stats

# Docker Composeサービスの状態
docker compose ps
```

## 💡 精算アルゴリズム

このアプリケーションでは、グループメンバー間の精算を最小化するためにGreedy Algorithm（貪欲アルゴリズム）を使用しています。

### アルゴリズムの詳細

1. **メンバーの貸し借り残高計算**: 各メンバーがいくら立て替えたか、いくら分担するべきかを計算
2. **最適な精算の算出**: 最大の債権者と最大の債務者をペアリングして精算を実行
3. **繰り返し処理**: すべての貸し借り残高が0になるまで繰り返し

### 貸し借り残高の概念

- **正の値（+）**: そのメンバーがお金をもらう権利がある（債権者）
- **負の値（-）**: そのメンバーがお金を払う義務がある（債務者）
- **0**: 貸し借りなし

### 具体例

3人グループ（Alice、Bob、Carol）で以下の支払いがあった場合：

```
初期状態:
- Alice: 3000円のランチ代を立て替え → 全員で割り勘（1人1000円ずつ）
- Bob: 2000円のコーヒー代を立て替え → 全員で割り勘（1人667円ずつ）

各メンバーの貸し借り残高:
- Alice: +3000 - 1000 - 667 = +1333円（1333円もらう）
- Bob: +2000 - 1000 - 667 = +333円（333円もらう）
- Carol: -1000 - 667 = -1667円（1667円払う）

精算手順（Greedy Algorithm）:
1. 最大債権者（Alice: +1333）と最大債務者（Carol: -1667）をペア
2. CarolがAliceに1333円支払い
   → Alice: 0円, Carol: -334円
3. 次に債権者（Bob: +333）と債務者（Carol: -334）をペア
4. CarolがBobに333円支払い
   → Bob: 0円, Carol: -1円（端数）

最終的に全員の貸し借り残高が0になり精算完了
```

### 実装方針

- **Greedy Algorithm**: 各ステップで局所的に最適な選択（最大債権者と最大債務者のペア）を行う
- **時間計算量**: O(n²) where n = メンバー数
- **最小精算回数**: 理論的最小回数での精算を保証

（Rust 実装は今後 `backend/src/main.rs` とは別モジュールとして実装予定）

## 📝 API仕様（REST / Rust/Axum）

- OpenAPI: `backend/openapi.yaml`
- 主なエンドポイント（例）:
  - `GET /healthz`
  - `GET /groups`, `POST /groups`, `GET /groups/{id}`, `PUT /groups/{id}`, `DELETE /groups/{id}`
  - `POST /groups/{id}/members`, `DELETE /groups/{id}/members/{member_id}`
  - `GET /groups/{id}/expenses`, `POST /groups/{id}/expenses`
  - `PUT /expenses/{expense_id}`, `DELETE /expenses/{expense_id}`
  - `POST /groups/{id}/settlements/calculate`

フロントエンドは `.env` の `VITE_API_MODE=rest` によりRESTを利用します。


## 🤝 コントリビューション

1. 機能ブランチを作成
2. 変更をコミット
3. テストとLintが通ることを確認
   ```bash
   # フロントエンド
   npm run test:ci
   npm run lint:ci
   
   # バックエンド（Rust）: 現状は手動でユニットテストを追加して実行してください
   ```
4. プルリクエストを作成

### 開発ガイドライン

- **コミットメッセージ**: 英語で簡潔に
- **テストカバレッジ**: 新機能には必ずテストを追加
- **コードスタイル**: Biome（フロントエンド）、gofmt（バックエンド）に従う
- **型安全性**: TypeScript・Go の型安全性を活用

## 📄 ライセンス

MIT License
# Rust REST API（ローカル動作確認）
```bash
# ヘルスチェック
curl http://localhost:8080/healthz

# グループ作成
curl -X POST http://localhost:8080/groups \
  -H 'Content-Type: application/json' \
  -d '{
    "name":"Demo Group",
    "currency":"JPY",
    "memberNames":["Alice","Bob"]
  }'

# グループ一覧
curl http://localhost:8080/groups
```
