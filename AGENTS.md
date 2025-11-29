# AGENTS.md

このドキュメントは、AIエージェントや開発者がコードを変更・拡張する際の設計指針です。

## 全体的な依頼事項

- パッケージ管理には pnpm を使用してください
- 作業完了後、`pnpm lint` と `pnpm typecheck` を実行してください
  - lintの修正は、ignoreや`as any`で回避せず、正しく修正してください
  - 場当たり的な修正が必要な場合は、ユーザーに確認してください

## 技術スタック

- Framework: Next.js (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- Components: shadcn/ui (Radix UI)
- State Management: TanStack React Query
- Database: Dexie.js (IndexedDB)
- AI SDK: @ax-llm/ax

## アーキテクチャ原則

### 1. Feature-based Architecture (Colocation)

機能ごとにディレクトリを分割し、関連するコードを近くに配置します。

#### ディレクトリ構造

- `features/`: 機能固有のコード
  - `components/`: UI (View)
  - `hooks/`: ロジック (facade/queries/commands)
  - `infrastructure/`: DB、API連携
  - `types/`, `utils/`: 型定義、ユーティリティ
- `lib/`: 完全に機能非依存の汎用コード
- `app/`: Next.js App Router のルーティング定義
- `components/ui/`: 汎用UIコンポーネント

#### ファイル配置の判断基準

features/ に配置:
- 機能のドメイン知識に依存するコード
- 他の機能で再利用されない可能性が高いコード
- 例: ChatSession型、チャット専用のDB定義

lib/ に配置:
- 機能ドメインに依存しない汎用的なコード
- 型パラメータで抽象化できるコード
- 例: Session<T>型、ストリーミング処理

迷ったらfeatures/に: YAGNI原則に従い、必要になってから汎用化を検討

### 2. View/Logic分離 (Separation of Concerns)

UI（表示）とロジック（状態・振る舞い）を明確に分離します。

#### Componentの責務

- UIのレンダリングのみに集中
- 複雑な`useState`や`useEffect`は避ける
- Custom Hookを呼び出して、返される値で表示

#### Hookの層別構造

複雑な機能の場合、hooks/内を以下のように分割:

```
features/chat/hooks/
├── facade/           # Facade Hook (ViewModel)
├── queries/          # Query Hook (Read操作)
├── commands/         # Command Hook (Write操作)
└── use-chat-repository.ts  # 型安全なRepository Hook
```

各層の責務:

1. Facade Hook: 複数のQuery/Command Hookを統合し、UIに必要な状態と操作を提供
2. Query Hook: データ購読に特化(Dexie Live Query、React Query)、副作用なし
3. Command Hook: データ更新・操作に特化

実装例:

```typescript
// Component
const { messages, handleSend } = useChat(); // Facade Hookのみ呼び出す

// Facade Hook
export function useChat() {
  const { messages } = useChatSession(id);     // Query
  const { sendMessage } = useSendMessage();    // Command
  return { messages, handleSend: sendMessage };
}
```

いつ層別構造を導入するか:
- 単純な機能: hooks/直下 (1-3個のhook)
- 複雑な機能: facade/queries/commands/ (4個以上、または責務が混在)

### 3. データ管理パターン

#### Dexie Live Query (推奨)

IndexedDBの変更を自動的にUIに反映します。

```typescript
import { useLiveQuery } from 'dexie-react-hooks';

const messages = useLiveQuery(
  () => db.messages.where('sessionId').equals(sessionId).sortBy('createdAt'),
  [sessionId]
) ?? [];
```

特徴:
- DB変更が自動的にコンポーネントに反映
- React Queryのキャッシュ管理不要
- ストリーミング中の更新も自動反映

#### ストリーミング処理

`lib/stream/use-stream-fetch.ts` を使用:

```typescript
const { fetchStream } = useStreamFetch();

await fetchStream('/api/chat', request, {
  onStream: async (_, accumulated) => {
    // 各チャンク受信時にDB更新 → Live Queryが自動的にUIに反映
    await repository.updateMessage(id, { content: accumulated.answer });
  },
});
```

### 4. Repository パターン

データアクセス層を抽象化し、型安全性を確保します。

```typescript
// lib/ - 汎用Repository
export interface SessionRepository<TData> {
  create(session: Session<TData>): Promise<void>;
  save(session: Session<TData>): Promise<void>;
  delete(id: string): Promise<void>;
}

// features/ - 機能固有Repository
export interface ChatSessionRepository extends SessionRepository<ChatSessionData> {
  addMessage(message: Message): Promise<void>;
  updateMessage(id: string, updates: Partial<Message>): Promise<void>;
}
```

#### 型安全なRepository Hook

型キャストを隠蔽するため、専用Hookを作成:

```typescript
export function useChatRepository(): ChatSessionRepository {
  return useSessionRepository<ChatSessionData>() as ChatSessionRepository;
}

// 使用例: 型キャスト不要
const repo = useChatRepository();
await repo.addMessage(message);
```

### 5. UI/UX & API通信

- ユーザーフィードバック: `isLoading`時はローディング表示
- エラーハンドリング: わかりやすいエラーメッセージ
- AbortController: ストリーミング/長時間リクエストには`AbortSignal`を実装

---

## 開発原則

新規機能実装時は、以下の5原則に従ってください:

1. コンポーネントにロジックを書かない → すべてHookに委譲
2. Facade Hookで統合する → コンポーネントは1つのFacade Hookのみ呼び出す
3. Query/Commandを分離する → Read/Write操作を明確に分ける
4. 汎用化は後回し → まず機能固有で実装、必要になったら汎用化 (YAGNI)
5. 型安全性を最優先 → 型キャストが必要なら専用Hookを作成
