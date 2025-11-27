# AGENTS.md

このドキュメントは、プロジェクトの設計思想、アーキテクチャパターン、および開発のベストプラクティスをまとめたものです。
AIエージェントや開発者がコードを変更・拡張する際の指針として使用してください。

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
    *   **`components/`**: その機能固有のUIコンポーネント。
    *   **`hooks/`**: その機能固有のロジックやデータフェッチ。
    *   **`types/`**: その機能固有の型定義。
    *   **`api/`**: サーバーサイドのロジック（Next.jsのAPI Routeから呼び出されるハンドラなど）を置くこともあります。
*   **`app/`**: Next.js App Routerのルーティング定義。
    *   各ページ（`page.tsx`）は、主に `features` からコンポーネントをインポートして配置するだけの役割を持ちます。
    *   `api/` 以下の Route Handlers も、複雑なロジックは `features` 内に移譲することを推奨します。
*   **`components/ui/`**: アプリケーション全体で共有される、機能に依存しない汎用的なUIコンポーネント（Buttons, Inputs, Cardsなど）。`shadcn/ui` で生成されたものが中心です。
*   **`lib/`**: アプリケーション全体で共有されるユーティリティ関数。

### 2. ストリーミングデータの管理 (React Query Pattern)

AIチャットのようなストリーミングレスポンスを扱う際、`useState` による頻繁な再レンダリングを管理しやすくするため、**React Query** を状態管理の中核として使用するパターンを採用しています。

#### 概要
*   **Mutation (`useMutation`)**: APIリクエストの開始、ストリームの読み込み、およびキャッシュの更新を担当します。
*   **Query (`useQuery`)**: キャッシュされたデータの購読（表示）のみを担当します。APIコールは行いません。

#### 実装のポイント

このパターンでは、`useQuery` はサーバーからのフェッチを行わず、Mutationによって更新されるキャッシュを監視する役割のみを持ちます。

```typescript
// features/chat/hooks/use-completion.ts の例

export default function useCompletionRQ() {
  const id = useId();
  const queryClient = useQueryClient();

  // 1. キャッシュの購読用 Query
  // フェッチは行わないため enabled: false にするが、
  // v5以降は queryFn が必須のためダミー関数を渡す。
  const { data: completion } = useQuery<string>({
    queryKey: ["completion", id],
    queryFn: () => "", // ダミー関数
    initialData: "",
    staleTime: Infinity,
    enabled: false, // 自動フェッチ無効化
  });

  // 2. データ取得と更新用 Mutation
  const { mutate } = useMutation({
    mutationKey: ["mutate-completion", id],
    mutationFn: async (prompt: string) => {
      // ... ストリーム処理 ...
      
      // チャンクごとにキャッシュを直接更新する
      for await (const token of stream) {
        queryClient.setQueryData<string>(
          ["completion", id],
          (prev) => (prev ? prev + token : token)
        );
      }
    },
  });

  return { mutate, completion };
}
```

### 3. UI/UX ベストプラクティス

*   **ユーザーフィードバック**: 非同期処理中（`isLoading`）は、適切なローディングインジケーターやスケルトンを表示してください。
*   **エラーハンドリング**: APIリクエストの失敗時には、ユーザーに分かりやすいエラーメッセージを表示し、必要に応じてリトライの手段を提供してください。
*   **アクセシビリティ**: `shadcn/ui` (Radix UI) のアクセシビリティ機能を活かし、セマンティックなHTML構造を維持してください。

### 4. API通信

*   **AbortController**: ストリーミングや長時間実行されるリクエストには、必ず `AbortSignal` を実装し、ユーザーが中断できるように、またはコンポーネントのアンマウント時に通信をキャンセルできるようにしてください。

---

新規機能を実装する際は、これらのパターンに従い、一貫性を維持してください。
特に、新しい機能を追加する場合は `features/` ディレクトリの下に新しいディレクトリを作成し、そこにコードをまとめるようにしてください。