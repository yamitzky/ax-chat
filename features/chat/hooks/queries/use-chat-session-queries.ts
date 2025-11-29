import { db } from '../../infrastructure/db';
import { useLiveQuery } from 'dexie-react-hooks';
import type { ChatSession, Message } from '../../types';

/**
 * セッションとメッセージを同時に取得するフック
 */
export function useChatSession(sessionId: string | null): {
  session: ChatSession | undefined;
  messages: Message[];
} {
  const session = useLiveQuery(
    () => (sessionId ? db.chatSessions.get(sessionId) : undefined),
    [sessionId]
  );

  const messages = useLiveQuery<Message[]>(
    () => sessionId
      ? db.messages
          .where('sessionId')
          .equals(sessionId)
          .sortBy('createdAt')
      : Promise.resolve<Message[]>([]),
    [sessionId]
  ) ?? [];

  return { session, messages };
}

/**
 * セッション一覧を購読（Live Query、更新日時降順）
 */
export function useChatSessionList(): ChatSession[] {
  return (
    useLiveQuery(
      () =>
        db.chatSessions
          .orderBy('metadata.updatedAt')
          .reverse()
          .toArray(),
      []
    ) ?? []
  );
}
