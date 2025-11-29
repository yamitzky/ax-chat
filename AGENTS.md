# AGENTS.md

このドキュメントは、プロジェクトの設計思想、アーキテクチャパターン、および開発のベストプラクティスをまとめたものです。
AIエージェントや開発者がコードを変更・拡張する際の指針として使用してください。

## 全体的な依頼事項

- パッケージ管理には pnpm を使っています。コマンドはpnpmで実行してください
- 作業が完了したら pnpm lintとpnpm typecheckを実行してください
  - lint の修正は、ignore したり as any といった回避ではなく、ちゃんと修正してください。
  - もしどうしても場当たり的に修正したい場合は、ユーザーに確認してください

## 技術スタック

*   **Framework**: Next.js (App Router)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **Components**: shadcn/ui (Radix UI based)
*   **State & Async Management**: TanStack React Query

## アーキテクチャと設計パターン

### 1. Feature-based Architecture (Colocation)

アプリケーションのスケーラビリティを確保するため、機能（Feature）ごとにディレクトリを分割し、関連するコードを近くに配置する **Colocation** を採用しています。

#### ディレクトリ構造の責務

*   **`features/`**: 特定の機能ドメインに関連するコード（コンポーネント、フック、型定義など）を格納します。
    *   例: `features/chat/` にはチャット機能に関連するすべてが含まれます。
    *   **`components/`**: その機能固有のUIコンポーネント（View）。ロジックは極力持たせません。
    *   **`hooks/`**: その機能固有のロジック、状態管理、データフェッチ（詳細は後述）。
    *   **`infrastructure/`**: データベースアクセス、外部API連携などのインフラ層。
    *   **`types/`**: その機能固有の型定義。
    *   **`utils/`**: その機能固有のユーティリティ関数。
*   **`lib/`**: **完全に機能非依存**の汎用コード。他の機能でも再利用可能なコードのみを配置します。
    *   **`lib/ai/`**: AI関連の汎用コード（client.ts, providers.ts）。
    *   **`lib/hooks/`**: 汎用的なReact Hooks（例: use-scroll-to-bottom.ts）。
    *   **`lib/session/`**: セッション管理の汎用抽象化（Repository パターン、型定義）。
    *   **`lib/stream/`**: ストリーミング処理の汎用化。
    *   **`lib/utils/`**: 汎用ユーティリティ関数（text.ts など）。
*   **`app/`**: Next.js App Routerのルーティング定義。各ページは `features` からコンポーネントをインポートして配置するだけの役割とします。
*   **`components/ui/`**: アプリケーション全体で共有される、機能に依存しない汎用的なUIコンポーネント（Buttons, Inputs, Cardsなど）。

#### ファイル配置の原則

**機能固有 vs 汎用の判断基準:**

1. **`features/*/` に配置すべきもの:**
   - その機能のドメイン知識に依存するコード
   - 他の機能で再利用される可能性が低いコード
   - 例: ChatSession型、チャット専用のDB定義、メッセージ送信ロジック

2. **`lib/` に配置すべきもの:**
   - 機能ドメインに依存しない汎用的なコード
   - 型パラメータで抽象化できるコード
   - 他の機能でも使える可能性が高いコード
   - 例: Session<T>型、ストリーミング処理、テキスト処理ユーティリティ

3. **迷ったら `features/` に配置:**
   - 過度な汎用化は避け、必要になったタイミングで `lib/` に移動することを検討します。
   - YAGNI (You Aren't Gonna Need It) の原則に従います。

### 2. Separation of Concerns (View vs Logic)

コンポーネントの肥大化を防ぎ、保守性を高めるため、**UI（表示）** と **Logic（状態・振る舞い）** を明確に分離します。

#### 実装ルール
*   **Components (`components/`)**:
    *   `"use client"` が必要な場合でも、複雑な `useState` や `useEffect` を直接記述することを避けます。
    *   専用の Custom Hook を呼び出し、そこから返される値と関数を使ってレンダリングのみに集中します。

*   **Hooks (`hooks/`)** - 層別フォルダ構造:

    機能が複雑になった場合、`hooks/` 内を以下のように層別に分割します：

    ```
    features/chat/hooks/
    ├── facade/           # Facade Hook層（ViewModel）
    │   ├── use-chat.ts
    │   └── use-sessions.ts
    ├── queries/          # Query Hook層（データ購読）
    │   └── use-chat-session-queries.ts
    ├── commands/         # Command Hook層（操作実行）
    │   ├── use-send-message.ts
    │   └── use-update-llm-provider.ts
    └── use-chat-repository.ts  # 型安全なRepository Hook
    ```

    **各層の責務:**

    1. **Facade Hook (`facade/`)**:
       - コンポーネントが必要とする状態と操作をまとめて提供する ViewModel 的な役割
       - 複数のQuery/Command Hookを組み合わせて使用
       - コンポーネントはこのFacade Hookのみを呼び出す
       - 例: `useChat`, `useSessions`

    2. **Query Hook (`queries/`)**:
       - データの購読・取得に特化（Read操作）
       - Dexie Live QueryやReact Queryを使用
       - 副作用を持たない
       - 例: `useChatSession`, `useChatSessionList`

    3. **Command Hook (`commands/`)**:
       - データの更新・操作に特化（Write操作）
       - 例: `useSendMessage`, `useUpdateLLMProvider`

    4. **型安全なRepository Hook**:
       - 汎用Repository hookに型キャストが必要な場合、専用hookを作成
       - 例: `useChatRepository` → 型キャスト不要で `ChatSessionRepository` を返す

```typescript
// features/chat/components/Chat.tsx (View)
export default function Chat() {
  // ロジックはすべてこのFacade Hookに隠蔽する
  const { messages, handleSend, isLoading } = useChat();

  return (
    <div>
       {/* UIの記述に集中 */}
    </div>
  );
}

// features/chat/hooks/facade/use-chat.ts (Facade Hook)
export function useChat(options) {
  // Query Hookでデータ購読
  const { session, messages } = useChatSession(sessionId);

  // Command Hookで操作を提供
  const { sendMessage, isStreaming } = useSendMessage({...});
  const { updateLLMProvider } = useUpdateLLMProvider();

  // UIに必要な状態と操作をまとめて返す
  return { messages, handleSend, isLoading, ... };
}
```

#### いつ層別フォルダ構造を導入すべきか

- **単純な機能**: hooks/ 直下にファイルを配置（1〜3個程度のhook）
- **複雑な機能**: facade/queries/commands/ に分割（4個以上のhook、または責務が混在している場合）
- チャット機能のように複数の操作（メッセージ送信、セッション管理、プロバイダー変更）がある場合は、層別構造を推奨します。

### 3. データ管理パターン

#### 3.1 Dexie Live Query パターン（推奨）

IndexedDBを使用する場合、**Dexie Live Query** を使用してリアルタイムなデータ購読を実現します。

```typescript
// features/chat/hooks/queries/use-chat-session-queries.ts の例
import { db } from '../../infrastructure/db';
import { useLiveQuery } from 'dexie-react-hooks';

export function useChatSession(sessionId: string | null) {
  const session = useLiveQuery(
    () => (sessionId ? db.chatSessions.get(sessionId) : undefined),
    [sessionId]
  );

  const messages = useLiveQuery(
    () => sessionId
      ? db.messages.where('sessionId').equals(sessionId).sortBy('createdAt')
      : Promise.resolve([]),
    [sessionId]
  ) ?? [];

  return { session, messages };
}
```

**特徴:**
- DBの変更が自動的にコンポーネントに反映される
- React QueryのキャッシュやMutationは不要
- ストリーミング中のデータ更新も自動的に反映される

#### 3.2 ストリーミング処理パターン

ストリーミングAPIからのデータ取得には、`lib/stream/use-stream-fetch.ts` を使用します。

```typescript
// features/chat/hooks/commands/use-send-message.ts の例
import { useStreamFetch } from '@/lib/stream/use-stream-fetch';

export function useSendMessage(options) {
  const repository = useChatRepository();
  const { fetchStream, isStreaming } = useStreamFetch<ChatRequest, ChatResponse>();

  const sendMessage = useCallback(async (content, session) => {
    // ストリーミング中にDBをリアルタイム更新
    await fetchStream('/api/chat', request, {
      onStream: async (_, accumulated) => {
        // 各チャンク受信時にDB更新（Live Queryが自動的にUIに反映）
        await repository.updateMessage(messageId, {
          content: accumulated.answer,
          thinking: accumulated.thought,
        });
      },
    });
  }, [fetchStream, repository]);

  return { sendMessage, isStreaming };
}
```

**ポイント:**
- `onStream` コールバック内でDBを更新
- Live QueryがDB変更を検知し、UIが自動的に更新される
- React Queryのキャッシュ管理は不要

### 4. 型安全性とDependency Injection

#### 4.1 Repository パターン

データアクセス層は Repository パターンで抽象化します。

```typescript
// lib/session/repository.ts - 汎用Repository定義
export interface SessionRepository<TData> {
  create(session: Session<TData>): Promise<void>;
  save(session: Session<TData>): Promise<void>;
  delete(id: string): Promise<void>;
}

// features/chat/infrastructure/chat-session-repository.ts - 機能固有のRepository
export interface ChatSessionRepository extends SessionRepository<ChatSessionData> {
  addMessage(message: Message): Promise<void>;
  updateMessage(id: string, updates: Partial<Message>): Promise<void>;
  getMessages(sessionId: string): Promise<Message[]>;
}

export const chatSessionRepository: ChatSessionRepository = {
  // Dexie実装
  ...
};
```

#### 4.2 型安全なRepository Hook

汎用Repository hookに型キャストが必要な場合、専用hookを作成して型安全性を向上させます。

```typescript
// features/chat/hooks/use-chat-repository.ts
import { useSessionRepository } from '@/lib/session/repository';
import type { ChatSessionRepository } from '../infrastructure/chat-session-repository';

export function useChatRepository(): ChatSessionRepository {
  return useSessionRepository<ChatSessionData>() as ChatSessionRepository;
}

// 使用例
const repository = useChatRepository(); // 型キャスト不要、完全に型安全
await repository.addMessage(message);
```

**メリット:**
- 型キャスト（`as`）を各Hookで書く必要がない
- ChatSessionRepository固有のメソッド（addMessage等）が型推論される
- リファクタリング時の変更箇所が1箇所に集約される

### 6. UI/UX ベストプラクティス

*   **ユーザーフィードバック**: 非同期処理中（`isLoading`）は、適切なローディングインジケーターやスケルトンを表示してください。
*   **エラーハンドリング**: APIリクエストの失敗時には、ユーザーに分かりやすいエラーメッセージを表示してください。

### 7. API通信

*   **AbortController**: ストリーミングや長時間実行されるリクエストには、必ず `AbortSignal` を実装し、通信の中断を可能にしてください。

---

新規機能を実装する際は、これらのパターンに従い、一貫性を維持してください。
特に、以下の原則を意識してください：

1. **「コンポーネントにロジックを書かない」** - すべてHookに委譲
2. **「Facade Hookで統合する」** - コンポーネントは1つのFacade Hookのみを呼び出す
3. **「Query/Commandを分離する」** - データ取得と更新操作を明確に分ける
4. **「汎用化は後回し」** - まず機能固有で実装し、再利用が必要になったら汎用化
5. **「型安全性を最優先」** - 型キャストが必要なら専用Hookを作成
