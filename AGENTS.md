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
    *   **`hooks/`**: その機能固有のロジック、状態管理、データフェッチ。
    *   **`types/`**: その機能固有の型定義。
*   **`app/`**: Next.js App Routerのルーティング定義。各ページは `features` からコンポーネントをインポートして配置するだけの役割とします。
*   **`components/ui/`**: アプリケーション全体で共有される、機能に依存しない汎用的なUIコンポーネント（Buttons, Inputs, Cardsなど）。

### 2. Separation of Concerns (View vs Logic)

コンポーネントの肥大化を防ぎ、保守性を高めるため、**UI（表示）** と **Logic（状態・振る舞い）** を明確に分離します。

#### 実装ルール
*   **Components (`components/`)**:
    *   `"use client"` が必要な場合でも、複雑な `useState` や `useEffect` を直接記述することを避けます。
    *   専用の Custom Hook を呼び出し、そこから返される値と関数を使ってレンダリングのみに集中します。
*   **Hooks (`hooks/`)**:
    *   **Facade Hook (例: `useChat`)**: コンポーネントが必要とする状態と操作をまとめて提供する ViewModel 的な役割を果たします。
    *   **Logic Hooks (例: `useStreamCompletion`, `useScrollToBottom`)**: 特定の機能（API通信、DOM操作など）に特化した再利用可能なロジックです。

```typescript
// features/chat/components/Chat.tsx (View)
export default function Chat() {
  // ロジックはすべてこのフックに隠蔽する
  const { messages, handleSend, isLoading } = useChat(); 
  
  return (
    <div>
       {/* UIの記述に集中 */}
    </div>
  );
}
```

### 3. ストリーミングデータの管理 (React Query Pattern)

AIチャットのようなストリーミングレスポンスを扱う際、状態管理の中核として **React Query** を使用します。

#### 実装のポイント

`useQuery` はサーバーからのフェッチを行わず、Mutationによって更新されるキャッシュを監視する役割のみを持ちます。

```typescript
// features/chat/hooks/use-stream-completion.ts の例

export default function useStreamCompletion() {
  const id = useId();
  const queryClient = useQueryClient();

  // 1. キャッシュの購読用 Query (Fetchはしない)
  const { data: completion } = useQuery<string>({
    queryKey: ["completion", id],
    queryFn: () => "", // ダミー関数（v5要件）
    initialData: "",
    enabled: false, // 自動フェッチ無効化
  });

  // 2. データ取得と更新用 Mutation
  const { mutateAsync } = useMutation({
    mutationKey: ["mutate-completion", id],
    mutationFn: async (prompt: string) => {
      // ストリーム処理を行い、queryClient.setQueryData でキャッシュを更新する
    },
  });

  return { mutateAsync, completion };
}
```

### 4. UI/UX ベストプラクティス

*   **ユーザーフィードバック**: 非同期処理中（`isLoading`）は、適切なローディングインジケーターやスケルトンを表示してください。
*   **エラーハンドリング**: APIリクエストの失敗時には、ユーザーに分かりやすいエラーメッセージを表示してください。

### 5. API通信

*   **AbortController**: ストリーミングや長時間実行されるリクエストには、必ず `AbortSignal` を実装し、通信の中断を可能にしてください。

---

新規機能を実装する際は、これらのパターンに従い、一貫性を維持してください。
特に、**「コンポーネントにロジックを書かない」** ことを意識してください。
