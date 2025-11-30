# axchat

[English](./README.md) | [日本語](./README.ja.md)

> @ax-llm/ax を活用した AI チャットアプリケーションのデモ

[@ax-llm/ax](https://axllm.dev/) を使った AI チャットアプリケーションです。Google Vertex AI 経由で複数の LLM プロバイダー (Gemini、Claude) をサポートし、ストリーミングレスポンスと IndexedDB (Dexie.js経由) によるクライアントサイド永続化を実現しています。

## 特徴

- **統一された LLM インターフェース** - [@ax-llm/ax](https://axllm.dev/) による複数プロバイダーの一貫した API
- **複数 LLM 対応** - Vertex AI 経由で Gemini (2.5 Pro、Flash、3.0 Pro) と Claude (Sonnet、Opus、Haiku) をサポート
- **ストリーミングレスポンス** - 思考プロセスの表示を含むリアルタイムメッセージストリーミング
- **Web 検索統合** - Web 検索機能による回答の強化
- **クライアントサイド永続化** - IndexedDB (Dexie.js) による完全なオフラインサポート
- **UI** - shadcn/ui、Radix UI、Tailwind CSS で構築

## 技術スタック

### フロントエンド

- **Next.js 16** (App Router) - サーバー/クライアントコンポーネントを持つ React フレームワーク
- **React 19** - 強化された並行機能を持つ最新の React
- **TypeScript** - 型安全な開発
- **shadcn/ui** - Radix UI 上に構築された高品質 UI コンポーネント
- **Tailwind CSS v4** - ユーティリティファースト CSS フレームワーク

### AI & バックエンド

- **@ax-llm/ax** - 複数プロバイダーに対応した統一 LLM SDK
- **Google Vertex AI** - Gemini と Claude のための AI プラットフォーム
- **google-auth-library** - Vertex AI 認証

### データ永続化

- **Dexie.js** - TypeScript サポート付き IndexedDB ORM

## Getting Started

### 前提条件

- Node.js 22 以上
- pnpm パッケージマネージャー
- Vertex AI が有効化された Google Cloud プロジェクト

### インストール

```bash
pnpm install
```

### 環境設定

サンプルから `.env` ファイルを作成します:

```bash
cp example.env .env
```

Google Cloud の認証情報で `.env` を編集します:

```env
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_LOCATION=asia-northeast1
```

### Google Cloud 認証

Application Default Credentials (ADC) を設定します:

```bash
# オプション 1: gcloud CLI を使用 (ローカル開発推奨)
gcloud auth application-default login
```

**必要な IAM 権限**:
- Vertex AI User (Gemini と Claude の両方のアクセス用)

### 開発サーバー

```bash
pnpm dev
```

[http://localhost:3000](http://localhost:3000) を開いてアプリケーションを表示します。

### 本番環境向けビルド

```bash
pnpm build
pnpm start
```

### lint

```bash
# リンター実行
pnpm lint

# 型チェック
pnpm typecheck
```


## プロジェクト構造

```
axchat/
├── app/                    # Next.js App Router
│   ├── api/chat/          # ストリーミング API エンドポイント
│   ├── page.tsx           # メインチャットページ
│   └── providers.tsx      # React Query & Repository DI
├── features/chat/          # チャット機能モジュール
│   ├── components/        # UI 層 (View)
│   ├── hooks/             # ロジック層
│   │   ├── facade/        # Facade Hooks (ViewModel)
│   │   ├── queries/       # Query Hooks (Read)
│   │   └── commands/      # Command Hooks (Write)
│   ├── infrastructure/    # DB 定義
│   └── types/             # 型定義
├── lib/                   # 機能非依存のユーティリティ
│   ├── ai/                # AI クライアント設定
│   ├── stream/            # ストリーミングユーティリティ
│   └── session/           # セッション管理
└── components/ui/          # 共有 UI コンポーネント
```

## ライセンス

MIT
