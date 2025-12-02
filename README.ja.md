# axchat

[English](./README.md) | [日本語](./README.ja.md)

> @ax-llm/ax を活用した AI チャットアプリケーションのデモ

[@ax-llm/ax](https://axllm.dev/) を使った AI チャットアプリケーションです。Google Vertex AI 経由で複数の LLM プロバイダー (Gemini、Claude) をサポートし、ストリーミングレスポンスと IndexedDB (Dexie.js経由) によるクライアントサイド永続化を実現しています。

![Dec-02-2025 10-48-16](https://github.com/user-attachments/assets/ae0de368-61f1-4f2e-b37b-90307da84c98)


## 特徴

- **統一された LLM インターフェース** - [@ax-llm/ax](https://axllm.dev/) による複数プロバイダーの一貫した API
- **複数 LLM 対応** - Vertex AI 経由で Gemini (2.5 Pro、Flash、3.0 Pro) と Claude (Sonnet、Opus、Haiku) をサポート
- **ストリーミングレスポンス** - 思考プロセスの表示を含むリアルタイムメッセージストリーミング
- **Web 検索統合** - Web 検索機能による回答の強化
- **型安全なAPI通信** - Hono RPC による型安全でスキーマファーストなAPI設計
- **高速な状態管理** - Zustand + Immerによる最適化されたグローバル状態管理
- **クライアントサイド永続化** - IndexedDB (Dexie.js) によるオフライン対応
- **モダンなUI** - shadcn/ui、Radix UI、Tailwind CSS v4

## 技術スタック

### フロントエンド

- **Next.js 16** (App Router) - サーバー/クライアントコンポーネントを持つ React フレームワーク
- **React 19** - 強化された並行機能を持つ最新の React
- **TypeScript** - 型安全な開発
- **shadcn/ui** - Radix UI 上に構築された高品質 UI コンポーネント
- **Tailwind CSS v4** - ユーティリティファースト CSS フレームワーク

### 状態管理 & API

- **Zustand** - Immerと組み合わせた軽量なグローバル状態管理
- **Hono** - 型安全なRPCスタイルAPIフレームワーク
- **Zod** - TypeScript優先のスキーマバリデーション

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

# 自動修正
pnpm lint:fix

# 型チェック
pnpm typecheck
```


## プロジェクト構造

```
axchat/
├── app/                       # Next.js App Router
│   ├── api/[...route]/       # Hono API統合エンドポイント
│   ├── page.tsx              # メインチャットページ
│   ├── init.tsx              # Zustand初期化
│   └── providers.tsx         # Repository DI
├── features/chat/             # チャット機能モジュール
│   ├── api/                  # Honoルート定義、Zodスキーマ
│   ├── components/           # UI層
│   ├── operations/           # 統合Hook (ViewModel)
│   ├── store/                # Zustand Store (グローバル状態)
│   ├── repositories/         # Repository (データアクセス層)
│   ├── infrastructure/       # DB定義 (Dexie)
│   ├── types/                # 型定義
│   └── utils/                # ユーティリティ
├── lib/                      # 機能非依存
│   ├── ai/                   # AI設定
│   ├── apiClient/            # Hono RPCクライアント
│   ├── stream/               # SSEストリーミング
│   └── hooks/                # 汎用Hook
└── components/ui/             # shadcn/ui
```

## ライセンス

MIT
