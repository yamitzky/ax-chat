import { useSessionRepository } from '@/lib/session/repository';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import type { ChatSessionData, SessionListItem } from '../types';
import { useChatSessionList } from './use-chat-session-queries';

export function useSessions() {
  const router = useRouter();
  const repository = useSessionRepository<ChatSessionData>();

  // Dexie Live Query: セッション一覧（自動更新）
  const chatSessions = useChatSessionList();

  // SessionListItem形式に変換（後方互換性のため）
  const sessions: SessionListItem[] = chatSessions.map((s) => ({
    id: s.id,
    title: s.title,
    createdAt: s.metadata.createdAt,
    updatedAt: s.metadata.updatedAt,
    provider: s.data.llmProvider,
  }));

  // セッション切り替え（URLを変更）
  const switchSession = useCallback(
    (sessionId: string) => {
      router.push(`/${sessionId}`);
    },
    [router]
  );

  // タイトル更新
  const updateTitle = useCallback(
    async (sessionId: string, title: string) => {
      const session = chatSessions.find((s) => s.id === sessionId);
      if (!session) return;

      await repository.save({
        ...session,
        title,
        metadata: {
          ...session.metadata,
          updatedAt: Date.now(),
        },
      });
    },
    [chatSessions, repository]
  );

  return {
    sessions,
    switchSession,
    updateTitle,
  };
}
