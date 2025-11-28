This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

このプロジェクトは、AI チャットアプリケーションです。Google Vertex AI (Gemini) または Anthropic Claude (via Vertex AI) を使用してストリーミングチャットを実現しています。

## セットアップ

### 1. 依存関係のインストール

```bash
pnpm install
```

### 2. 環境変数の設定

`.env.example` を `.env` にコピーして、必要な値を設定します。

```bash
cp .env.example .env
```

`.env` ファイルを編集:

```bash
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_LOCATION=asia-northeast1
```

### 3. Google Cloud 認証の設定

Google Cloud のApplication Default Credentials (ADC) を設定します。

```bash
# オプション1: gcloud CLI を使用
gcloud auth application-default login

# オプション2: サービスアカウントキーを使用する場合
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json を .env に追加
```

必要な権限:
- Vertex AI User (Gemini を使用する場合)
- Vertex AI User (Claude を使用する場合)

### 4. 開発サーバーの起動

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションにアクセスします。

## 技術スタック

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **State Management**: TanStack React Query
- **AI SDK**: ax-llm (Google Gemini / Anthropic Claude)

## プロジェクト構造

```
axchat/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # ストリーミングAPIエンドポイント
│   ├── page.tsx                  # メインページ
│   └── layout.tsx
├── features/
│   └── chat/
│       ├── components/
│       │   └── Chat.tsx          # チャットUI (View)
│       ├── hooks/
│       │   ├── use-chat.ts       # チャットロジック (Facade Hook)
│       │   ├── use-stream-completion.ts  # ストリーミングAPI通信
│       │   └── use-scroll-to-bottom.ts   # スクロール制御
│       └── types/
│           └── index.ts          # 型定義
├── lib/
│   └── ai-client.ts              # AI クライアント設定
└── components/
    └── ui/                       # 共通UIコンポーネント
```

## アーキテクチャ

このプロジェクトは Feature-based Architecture と Separation of Concerns を採用しています。

詳細は `AGENTS.md` を参照してください。

## カスタマイズ

デフォルトでは `gemini-flash` モデルを使用します。別のモデルを使用する場合は、`use-chat.ts` のオプションを変更してください:

```typescript
const { messages, inputValue, setInputValue, isLoading, completion, handleSend } = useChat({
  provider: 'sonnet',  // 'gemini-pro', 'gemini-flash', 'sonnet', 'opus', 'haiku'
  useWebSearch: true,  // Web検索を有効化
});
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
