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

### 1. ストリーミングデータの管理 (React Query Pattern)

AIチャットのようなストリーミングレスポンスを扱う際、`useState` による頻繁な再レンダリングを管理しやすくするため、**React Query** を状態管理の中核として使用するパターンを採用しています。

#### 概要
*   **Mutation (`useMutation`)**: APIリクエストの開始、ストリームの読み込み、およびキャッシュの更新を担当します。
*   **Query (`useQuery`)**: キャッシュされたデータの購読（表示）のみを担当します。APIコールは行いません。

#### 実装のポイント

このパターンでは、`useQuery` はサーバーからのフェッチを行わず、Mutationによって更新されるキャッシュを監視する役割のみを持ちます。

```typescript
// hooks/use-completion.ts の例

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

### 2. ディレクトリ構造の責務

*   **`app/api/`**: Next.js Route Handlers。バックエンドロジックや外部APIへのプロキシとして機能します。Web標準の `Response` オブジェクトとストリームを返します。
*   **`hooks/`**: ビジネスロジックや状態管理ロジックをカプセル化します。UIコンポーネントから複雑な処理を分離するために積極的に使用してください。
*   **`components/ui/`**: `shadcn/ui` によって生成された、再利用可能なプリミティブコンポーネント。原則として手動修正は避け、デザインシステムの基盤とします。
*   **`components/`**: アプリケーション固有の機能を持つコンポーネント（例: `Chat.tsx`）。`hooks` を利用して振る舞いを実装します。

### 3. UI/UX ベストプラクティス

*   **ユーザーフィードバック**: 非同期処理中（`isLoading`）は、適切なローディングインジケーターやスケルトンを表示してください。
*   **エラーハンドリング**: APIリクエストの失敗時には、ユーザーに分かりやすいエラーメッセージを表示し、必要に応じてリトライの手段を提供してください。
*   **アクセシビリティ**: `shadcn/ui` (Radix UI) のアクセシビリティ機能を活かし、セマンティックなHTML構造を維持してください。

### 4. API通信

*   **AbortController**: ストリーミングや長時間実行されるリクエストには、必ず `AbortSignal` を実装し、ユーザーが中断できるように、またはコンポーネントのアンマウント時に通信をキャンセルできるようにしてください。

---

新規機能を実装する際は、これらのパターンに従い、一貫性を維持してください。
特に状態管理において、安易にグローバルステートライブラリを追加せず、まずは React Query のキャッシュ機構で解決できないか検討してください。
