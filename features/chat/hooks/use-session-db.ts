import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { Session, SessionListItem } from '../types';

// セッション一覧取得（最新100件、更新日時降順）
export function useSessionList(): SessionListItem[] | undefined {
  return useLiveQuery(
    () => db.sessions
      .orderBy('metadata.updatedAt')
      .reverse()
      .limit(100)
      .toArray()
      .then(sessions => sessions.map(s => ({
        id: s.id,
        title: s.title,
        createdAt: s.metadata.createdAt,
        updatedAt: s.metadata.updatedAt,
        provider: s.metadata.provider,
      }))),
    []
  );
}

// 特定のセッション取得
export function useSession(sessionId: string | null): Session | undefined {
  return useLiveQuery(
    () => sessionId ? db.sessions.get(sessionId) : undefined,
    [sessionId]
  );
}

// セッション保存
export async function saveSession(session: Session): Promise<void> {
  await db.sessions.put(session);
}

// セッション作成
export async function createSession(session: Session): Promise<string> {
  await db.sessions.add(session);
  return session.id;
}

// セッション更新
export async function updateSession(sessionId: string, changes: Partial<Session>): Promise<void> {
  await db.sessions.update(sessionId, changes);
}
