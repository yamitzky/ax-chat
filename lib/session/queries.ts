import { useLiveQuery } from 'dexie-react-hooks';
import type { Table } from 'dexie';
import type { Session } from './types';

/**
 * 汎用 Query hooks を生成する関数
 */
export function createSessionQueries<TData>(table: Table<Session<TData>>) {
  return {
    /**
     * 特定のセッションを購読（Live Query）
     */
    useSession(sessionId: string | null): Session<TData> | undefined {
      return useLiveQuery(
        () => (sessionId ? table.get(sessionId) : undefined),
        [sessionId]
      );
    },

    /**
     * セッション一覧を購読（Live Query、更新日時降順）
     */
    useSessionList(): Session<TData>[] {
      return (
        useLiveQuery(
          () =>
            table
              .orderBy('metadata.updatedAt')
              .reverse()
              .toArray(),
          []
        ) ?? []
      );
    },
  };
}
