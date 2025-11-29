import type { SessionRepository } from '@/lib/session/repository';
import type { ChatSession, ChatSessionData, Message } from '../types';
import { db } from '@/lib/db';

/**
 * チャット専用のRepository（メッセージ操作を含む）
 */
export interface ChatSessionRepository extends SessionRepository<ChatSessionData> {
  addMessage(message: Message): Promise<void>;
  getMessages(sessionId: string): Promise<Message[]>;
}

/**
 * Dexie 実装（チャット専用）
 */
export const chatSessionRepository: ChatSessionRepository = {
  create: async (session: ChatSession) => {
    await db.chatSessions.add(session);
  },

  save: async (session: ChatSession) => {
    await db.chatSessions.put(session);
  },

  delete: async (id: string) => {
    // カスケード削除: セッション削除時にメッセージも削除
    await db.transaction('rw', [db.chatSessions, db.messages], async () => {
      await db.messages.where('sessionId').equals(id).delete();
      await db.chatSessions.delete(id);
    });
  },

  addMessage: async (message: Message) => {
    await db.messages.add(message);
  },

  getMessages: async (sessionId: string) => {
    return await db.messages
      .where('sessionId')
      .equals(sessionId)
      .sortBy('createdAt');
  },
};
