import type { SessionRepository } from '@/lib/session/repository';
import type { ChatSession, ChatSessionData } from '../types';
import { db } from '@/lib/db';

/**
 * Dexie 実装（チャット専用）
 */
export const chatSessionRepository: SessionRepository<ChatSessionData> = {
  create: async (session: ChatSession) => {
    await db.chatSessions.add(session);
  },

  save: async (session: ChatSession) => {
    await db.chatSessions.put(session);
  },

  delete: async (id: string) => {
    await db.chatSessions.delete(id);
  },
};
