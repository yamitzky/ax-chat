# AGENTS.md

## 全体的な依頼事項

- パッケージ管理には pnpm を使用してください
- 作業完了後、`pnpm lint:fix` と `pnpm typecheck` を実行してください
  - lintの修正は、ignoreや`as any`で回避せず、正しく修正してください
  - 場当たり的な修正が必要な場合は、ユーザーに確認してください

## 技術スタック

- Framework: Next.js (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- Components: shadcn/ui (Radix UI)
- State Management: Zustand + Immer
- State Persistence: Dexie.js (IndexedDB)
- API Framework: Hono (Type-safe RPC)
- Validation: Zod
- Linter/Formatter: Biome
- AI SDK: @ax-llm/ax

## アーキテクチャ原則

### 1. Feature-based Architecture (Colocation)

機能ごとにディレクトリを分割し、関連するコードを近くに配置します。

#### ディレクトリ構造

- `features/`: 機能固有のコード
  - `components/`: UI (View)
  - `operations/`: 統合Hook (ViewModel層)
  - `store/`: Zustand Store (グローバル状態)
  - `repositories/`: Repository (データアクセス層)
  - `api/`: Honoルート定義、Zodスキーマ
  - `infrastructure/`: DB定義 (Dexie)
  - `types/`, `utils/`: 型定義、ユーティリティ
- `lib/`: 完全に機能非依存の汎用コード
  - `apiClient/`: Hono RPCクライアント
  - `stream/`: SSEストリーミング処理
  - `hooks/`: 汎用Hook
  - `ai/`: AI設定
- `app/`: Next.js App Router のルーティング定義
  - `api/[...route]/`: Hono統合エンドポイント
  - `providers.tsx`: Repository DI
- `components/ui/`: 汎用UIコンポーネント (shadcn/ui)

#### ファイル配置の判断基準

features/ に配置:
- 機能のドメイン知識に依存するコード
- 他の機能で再利用されない可能性が高いコード
- 例: ChatSession型、ChatRepository、チャット専用のDB定義、Honoルート定義

lib/ に配置:
- 機能ドメインに依存しない汎用的なコード
- 型パラメータで抽象化できるコード
- 例: SSEストリーミング処理、Hono RPCクライアント、汎用Hook

迷ったらfeatures/に: YAGNI原則に従い、必要になってから汎用化を検討

### 2. View/Logic分離 (Separation of Concerns)

UI（表示）とロジック（状態・振る舞い）を明確に分離します。

#### レイヤー構造

```
Component (View)
    ↓ 呼び出し
Operations Hook (ViewModel) ← Zustand Store (Global State)
    ↓ 呼び出し
Repository (Data Access)
    ↓
DB (Dexie)
```

#### 各層の責務

##### Component (View層)

- UIのレンダリングのみに集中
- `useState`は最小限（入力フィールド値など）
- Operations HookとZustand Storeのみ呼び出す

```typescript
// features/chat/components/Chat.tsx
export default function Chat() {
  // Query: Zustand Storeから状態を読み取る
  const activeMessages = useChatSessionStore((state) => state.activeMessages);
  const isStreaming = useChatSessionStore((state) => state.isStreaming);

  // Command: Operations Hookから操作を取得
  const { sendMessage } = useChatSessionOperations();

  const handleSend = async () => {
    await sendMessage(sessionId, inputValue);
  };

  return <div>{/* UIのみ */}</div>;
}
```

##### Operations Hook (ViewModel層)

複数のRepository操作、Zustand更新、外部API呼び出しを統合します。

```typescript
// features/chat/operations/use-chat-session-operations.ts
export function useChatSessionOperations() {
  const repository = useChatRepository();
  const { fetchStream } = useStreamFetch();

  const sendMessage = useCallback(async (sessionId, content) => {
    const state = useChatSessionStore.getState();

    // 1. Zustand更新（即座にUIに反映）
    state.addMessage(userMessage);

    // 2. DB永続化（非同期）
    await repository.createMessage(userMessage);

    // 3. API呼び出し（Hono RPC）
    await fetchStream(apiClient.chat.$post(...), {
      onStream: async (delta, accumulated) => {
        state.updateMessage(messageId, { content: accumulated.answer });
      }
    });

    // 4. ストリーミング完了後にDB永続化
    await repository.updateMessage(messageId, finalMessage);
  }, [repository]);

  return { sendMessage };
}
```

##### Zustand Store (State層)

アプリケーション全体で共有する状態を保持します。

```typescript
// features/chat/store/use-chat-session-store.ts
export const useChatSessionStore = create<ChatSessionStore>()(
  immer((set) => ({
    sessions: [],
    activeMessages: [],
    isStreaming: false,

    addMessage: (message) => set((state) => {
      state.activeMessages.push(message); // Immerで簡潔に記述
    }),

    updateMessage: (messageId, updates) => set((state) => {
      const msg = state.activeMessages.find(m => m.id === messageId);
      if (msg) Object.assign(msg, updates);
    }),
  }))
);
```

#### いつOperations層を導入するか

- **単純な機能**: 直接Repository Hookを呼び出す
  - 単純な機能でもOperation Hookを使用しても良い
- **複雑な機能**: Operations Hookで統合
  - 複数のRepository操作が必要
  - Zustand更新とDB更新を同期
  - 外部API呼び出しを含む
  - ストリーミング処理を含む

### 3. データ管理パターン

#### Zustand + Dexie パターン

グローバル状態管理（Zustand）とローカル永続化（Dexie）を組み合わせます。

**データフロー**:
```
初期化時: DB → Repository → Zustand Store
更新時: Zustand Store (即反映) + DB (永続化)
表示時: Zustand Store → Component
```

**特徴**:
- Zustandで高速な状態管理（再レンダリング最適化）
- Immerで不変更新を簡潔に記述
- Dexieでローカル永続化（オフライン対応）
- Operations層でZustand/DB更新を同期

**実装例**:
```typescript
// Operations Hook内
const sendMessage = async (sessionId, content) => {
  const state = useChatSessionStore.getState();

  // 1. メモリ更新（即座にUIに反映）
  state.addMessage(userMessage);

  // 2. DB永続化（非同期、エラー時もUI表示済み）
  await repository.createMessage(userMessage);
};
```

**利点**:
- UI反応速度が高速（メモリアクセス）
- 永続化とUI更新のタイミングを制御可能
- ストリーミング中も細かく状態更新可能

#### ストリーミング処理

`lib/stream/use-stream-fetch.ts`を使用してSSEストリーミングを処理します。

```typescript
const { fetchStream } = useStreamFetch(chatResponseDeltaSchema);

await fetchStream(
  apiClient.chat.$post({ json: request }), // Hono RPC
  {
    onStream: async (delta, accumulated) => {
      // 各チャンク受信時にZustand更新（即座にUI反映）
      state.updateMessage(messageId, { content: accumulated.answer });
    },
  }
);

// ストリーミング完了後にDB永続化（パフォーマンス）
await repository.updateMessage(messageId, finalMessage);
```

### 4. Hono RPC パターン

型安全でスキーマファーストなAPI通信を実現します。

#### アーキテクチャ

```
Client (apiClient.chat.$post)
    ↓ 型安全なRPC呼び出し
Server (Hono routes)
    ↓ Zodバリデーション
Handler (ビジネスロジック)
```

#### API定義（features/*/api/routes.ts）

Honoでルートを定義し、Zodでリクエストをバリデーションします。

```typescript
// features/chat/api/routes.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { chatRequestSchema } from './schemas';

export const chatRoutes = new Hono()
  .post('/chat', zValidator('json', chatRequestSchema), async (c) => {
    const { prompt, history, llmProvider } = c.req.valid('json'); // 型安全

    return streamSSE(c, async (stream) => {
      for await (const chunk of axStream) {
        await stream.writeSSE({ data: JSON.stringify(chunk.delta) });
      }
    });
  });
```

#### スキーマ定義（features/*/api/schemas.ts）

Zodでリクエスト/レスポンスのスキーマを定義します。

```typescript
// features/chat/api/schemas.ts
import { z } from 'zod';

export const chatRequestSchema = z.object({
  prompt: z.string(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })),
  llmProvider: z.string(),
  useWebSearch: z.boolean(),
});

export const chatResponseDeltaSchema = z.object({
  answer: z.string().optional(),
  thought: z.string().optional(),
});
```

#### ルート統合（app/api/[...route]/route.ts）

Next.js App Routerでルートを統合します。

```typescript
import { chatRoutes } from '@/features/chat/api/routes';
import { Hono } from 'hono';
import { handle } from 'hono/vercel';

const app = new Hono().basePath('/api').route('/', chatRoutes);

export const GET = handle(app);
export const POST = handle(app);

// 型定義をエクスポート（RPCクライアントで使用）
export type AppType = typeof app;
```

#### RPCクライアント（lib/apiClient/index.ts）

Hono RPCクライアントで型安全なAPI呼び出しを行います。

```typescript
import { hc } from 'hono/client';
import type { AppType } from '@/app/api/[...route]/route';

export const apiClient = hc<AppType>('/').api;
```

#### 利用（Operations Hook内）

```typescript
// features/chat/operations/use-chat-session-operations.ts
await fetchStream(
  apiClient.chat.$post({ // TypeScriptが型チェック
    json: {
      prompt: content,
      history: messages,
      llmProvider: 'gemini-flash', // 型安全
      useWebSearch: true,
    }
  }),
  { onStream: ... }
);
```

#### 利点

- **型安全**: TypeScriptの型がクライアント/サーバーで自動共有
- **バリデーション**: Zodで実行時にリクエストを検証
- **スキーマファースト**: スキーマが単一の真実の源
- **RPC風**: `apiClient.chat.$post()`で直感的な呼び出し
- **エディタ補完**: パラメータ、戻り値が補完される

### 5. Repository パターン

データアクセス層を抽象化し、型安全性とテスタビリティを確保します。

#### Repository実装

インターフェースと実装クラスを定義します。

```typescript
// features/chat/repositories/chat-repository.ts
export interface ChatRepository {
  // セッション操作
  findAllSessions(): Promise<ChatSession[]>;
  createSession(session: ChatSession): Promise<void>;
  updateSessionTitle(sessionId: string, title: string): Promise<void>;

  // メッセージ操作
  findMessagesBySessionId(sessionId: string): Promise<Message[]>;
  createMessage(message: Message): Promise<void>;
  updateMessage(messageId: string, updates: Partial<Message>): Promise<void>;
}

export class DexieChatRepository implements ChatRepository {
  async findAllSessions(): Promise<ChatSession[]> {
    return await db.chatSessions
      .orderBy('metadata.updatedAt')
      .reverse()
      .toArray();
  }

  async createMessage(message: Message): Promise<void> {
    await db.messages.add(message);
  }

  async updateSessionTitle(sessionId: string, title: string): Promise<void> {
    await db.chatSessions.update(sessionId, {
      title,
      'metadata.updatedAt': Date.now(),
    });
  }
  // ... その他
}
```

#### Repository Hook（DI）

Context APIでRepositoryを注入します。

```typescript
const ChatRepositoryContext = createContext<ChatRepository | null>(null);

export const ChatRepositoryProvider = ChatRepositoryContext.Provider;

export const useChatRepository = () => {
  const context = useContext(ChatRepositoryContext);
  if (!context) {
    throw new Error('ChatRepositoryContext not found');
  }
  return context;
};
```

#### Providerでの登録

```typescript
// app/providers.tsx
export default function Providers({ children }) {
  return (
    <ChatRepositoryProvider value={new DexieChatRepository()}>
      {children}
    </ChatRepositoryProvider>
  );
}
```

#### 利点

- **テスタビリティ**: モックRepositoryに差し替え可能
- **DB実装の切り替え**: Dexie → 他のDB実装も容易
- **型安全**: TypeScriptでデータアクセスを保証
- **関心の分離**: DB詳細をビジネスロジックから隠蔽

### 6. UI/UX & API通信

- ユーザーフィードバック: `isLoading`時はローディング表示
- エラーハンドリング: わかりやすいエラーメッセージ
- AbortController: ストリーミング/長時間リクエストには`AbortSignal`を実装

---

## 開発原則

新規機能実装時は、以下の原則に従ってください:

1. **コンポーネントにロジックを書かない**
   - すべてOperations HookとZustand Storeに委譲
   - Component内の`useState`は最小限（入力フィールドなど）

2. **状態はZustandで管理**
   - グローバル状態はZustand Store
   - Immer middlewareで不変更新を簡潔に
   - 永続化が必要な状態のみDBにも保存

3. **Operations Hookで統合**
   - 複数のRepository操作、Zustand更新、API呼び出しを1つのHookにまとめる
   - Componentは1つのOperations Hookのみ呼び出す

4. **ZustandとDBを同期**
   - Operations内でメモリ更新（Zustand）→ DB永続化の順序保証
   - ストリーミング中は細かくZustand更新、完了後にDB永続化

5. **型安全性を最優先**
   - Hono RPC で型を自動共有
   - Zod でスキーマを定義
   - TypeScriptの型チェックを最大限活用

6. **汎用化は後回し（YAGNI原則）**
   - まず機能固有で実装
   - 必要になってから汎用化を検討
   - lib/への移動は慎重に判断

--

## 外部リソース

- [Hono RPC](https://hono.dev/llms.txt)
- [ax-llm/ax](https://axllm.dev/llm.txt)
