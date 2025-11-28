import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionList } from './use-session-db';
import type { Session, SessionMetadata } from '../types';
import {
  createSession as dbCreateSession,
  updateSession as dbUpdateSession,
  saveSession as dbSaveSession,
} from './use-session-db';

export function useSessions() {
  const router = useRouter();

  // Dexie Live Query: セッション一覧（自動更新）
  const sessions = useSessionList() ?? [];

  // セッション作成（初回メッセージ送信時に自動作成）
  const createSession = useCallback(async (metadata: SessionMetadata): Promise<string> => {
    const newSession: Session = {
      id: crypto.randomUUID(),
      title: "新しいチャット",
      messages: [],
      metadata,
    };

    await dbCreateSession(newSession);

    // URLを新しいセッションに遷移
    router.push(`/${newSession.id}`);

    return newSession.id;
  }, [router]);

  // セッション切り替え（URLを変更）
  const switchSession = useCallback((sessionId: string) => {
    router.push(`/${sessionId}`);
  }, [router]);

  // セッション更新（メッセージ保存時）- 全体を保存
  const updateSessionData = useCallback(async (sessionId: string, changes: Partial<Session>) => {
    await dbUpdateSession(sessionId, {
      ...changes,
      metadata: changes.metadata ? {
        ...changes.metadata,
        updatedAt: Date.now(),
      } : undefined,
    });
  }, []);

  // セッションを丸ごと保存
  const saveFullSession = useCallback(async (session: Session) => {
    await dbSaveSession({
      ...session,
      metadata: {
        ...session.metadata,
        updatedAt: Date.now(),
      },
    });
  }, []);

  // タイトル更新
  const updateTitle = useCallback(async (sessionId: string, title: string) => {
    await dbUpdateSession(sessionId, { title });
  }, []);

  return {
    sessions,
    createSession,
    switchSession,
    updateSession: updateSessionData,
    saveFullSession,
    updateTitle,
  };
}
