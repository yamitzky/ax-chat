import type { ChatSession } from '@/features/chat/types';
import Dexie, { type Table } from 'dexie';

export class ChatDatabase extends Dexie {
  chatSessions!: Table<ChatSession, string>;

  constructor() {
    super('axchat');
    this.version(1).stores({
      sessions: 'id, metadata.updatedAt, metadata.createdAt',
    });
    // バージョン2: 新しい型定義に対応
    this.version(2)
      .stores({
        sessions: null, // 古いテーブルを削除
        chatSessions: 'id, metadata.updatedAt, metadata.createdAt',
      })
      .upgrade(async (tx) => {
        // マイグレーション: 既存のsessionsデータをchatSessionsに移行
        const oldSessions = await tx.table('sessions').toArray();
        if (oldSessions.length > 0) {
          const newSessions = oldSessions.map((oldSession: any) => ({
            id: oldSession.id,
            title: oldSession.title,
            data: {
              messages: oldSession.messages || [],
              llmProvider: oldSession.metadata?.provider || 'gemini-flash',
              useWebSearch: oldSession.metadata?.useWebSearch ?? true,
            },
            metadata: {
              createdAt: oldSession.metadata?.createdAt || Date.now(),
              updatedAt: oldSession.metadata?.updatedAt || Date.now(),
            },
          }));
          await tx.table('chatSessions').bulkAdd(newSessions);
        }
      });
  }
}

export const db = new ChatDatabase();
