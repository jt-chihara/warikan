# 割り勘アプリ (Warikan App)

グループでの支払いを記録し、最適な精算方法を計算する割り勘アプリケーションです。

## 🏗️ アーキテクチャ

- **フロントエンド**: React + TypeScript + Vite + TailwindCSS
- **ゲートウェイ**: GraphQL Gateway (Go)
- **バックエンド**: gRPCマイクロサービス (Go)
- **データベース**: PostgreSQL
- **開発環境**: Docker Compose

## 🚀 開発環境の構築

### 前提条件

- Docker Desktop がインストールされていること
- Git がインストールされていること

### セットアップ手順

1. **リポジトリをクローン**
   ```bash
   git clone <repository-url>
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
- **GraphQL Gateway**: http://localhost:8080/query (GraphQL Playground)
- **データベース**: localhost:5432

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
├── backend/
│   ├── gateway/             # GraphQL Gateway
│   │   ├── cmd/
│   │   ├── graph/
│   │   ├── Dockerfile
│   │   └── go.mod
│   └── services/
│       └── group/           # Group gRPCサービス
│           ├── cmd/
│           ├── internal/
│           ├── Dockerfile
│           └── go.mod
├── docker-compose.yml       # Docker Compose設定
├── .env.example             # 環境変数テンプレート
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
docker compose up gateway
docker compose up group-service
docker compose up db

# サービスの再起動
docker compose restart frontend

# サービスのログ確認
docker compose logs -f frontend
docker compose logs -f gateway
```

### デバッグ・開発作業

```bash
# コンテナ内でシェルを実行
docker compose exec frontend sh
docker compose exec gateway sh
docker compose exec group-service sh

# データベースに接続
docker compose exec db psql -U warikan -d warikan
```

## 🧪 テスト実行

### フロントエンドテスト

```bash
# コンテナ内でテスト実行
docker compose exec frontend npm test

# カバレッジ付きテスト
docker compose exec frontend npm run test:coverage

# ホストマシンでテスト実行 (node_modulesが必要)
cd frontend
npm test
```

### バックエンドテスト

```bash
# Group Serviceのテスト
docker compose exec group-service go test ./...

# カバレッジ付きテスト
docker compose exec group-service go test -coverprofile=coverage.out ./...
```

## 🔄 開発ワークフロー

### フロントエンド開発

1. コードを編集すると自動でホットリロードされます
2. `http://localhost:3000` でリアルタイムに変更を確認
3. GraphQL クエリは `http://localhost:8080/query` に送信されます

### バックエンド開発

1. Go のコードを編集すると自動で再起動されます
2. gRPC サービスは `localhost:50051` で起動
3. GraphQL Gateway は `localhost:8080` で起動

### データベース操作

```bash
# マイグレーション実行
docker compose exec group-service go run cmd/migrate/main.go

# データベース接続
docker compose exec db psql -U warikan -d warikan

# よく使うSQL
SELECT * FROM groups;
SELECT * FROM group_members;
SELECT * FROM expenses;
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
docker compose logs -f gateway
docker compose logs -f group-service
docker compose logs -f db
```

### リソース使用量

```bash
# コンテナのリソース使用量
docker stats

# Docker Composeサービスの状態
docker compose ps
```

## 🚀 本番環境への展開

本番環境用のDockerfileとdocker-compose.prod.ymlは別途作成してください。開発環境との主な違い：

- マルチステージビルドによる最適化
- セキュリティ設定の強化
- 環境変数の外部管理
- ヘルスチェックの追加
- ログ管理の設定

## 📝 API仕様

### GraphQL

GraphQL Playgroundで API を探索できます: http://localhost:8080/query

主要なクエリ・ミューテーション：

```graphql
# グループ作成
mutation CreateGroup($input: CreateGroupInput!) {
  createGroup(input: $input) {
    id
    name
    members {
      id
      name
    }
  }
}

# グループ取得
query GetGroup($id: ID!) {
  group(id: $id) {
    id
    name
    members {
      id
      name
    }
    expenses {
      id
      amount
      description
    }
  }
}
```

## 🤝 コントリビューション

1. 機能ブランチを作成
2. 変更をコミット
3. テストが通ることを確認
4. プルリクエストを作成

## 📄 ライセンス

MIT License
