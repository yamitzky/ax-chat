import type { ChatSession, Message } from '@/features/chat/types';
import Dexie, { type Table } from 'dexie';

export class ChatDatabase extends Dexie {
  chatSessions!: Table<ChatSession, string>;
  messages!: Table<Message, string>;

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
          const newSessions = oldSessions.map((oldSession: Record<string, unknown>) => {
            const oldMetadata = (oldSession.metadata as Record<string, unknown>) || {};
            return {
              id: oldSession.id,
              title: oldSession.title,
              data: {
                messages: oldSession.messages || [],
                llmProvider: (oldMetadata.provider as string) || 'gemini-flash',
                useWebSearch: oldMetadata.useWebSearch !== undefined ? (oldMetadata.useWebSearch as boolean) : true,
              },
              metadata: {
                createdAt: (oldMetadata.createdAt as number) || Date.now(),
                updatedAt: (oldMetadata.updatedAt as number) || Date.now(),
              },
            };
          });
          await tx.table('chatSessions').bulkAdd(newSessions);
        }
      });

    // バージョン3: messagesテーブルを追加（リレーショナル設計）
    this.version(3)
      .stores({
        chatSessions: 'id, metadata.updatedAt, metadata.createdAt',
        messages: 'id, sessionId, createdAt',
      })
      .upgrade(async (tx) => {
        // 1. 全セッションを取得
        const sessions = await tx.table('chatSessions').toArray();

        // 2. メッセージを抽出して新テーブルに挿入
        for (const session of sessions) {
          const sessionData = session.data as Record<string, unknown>;
          const messages = (sessionData.messages as Message[]) || [];
          const newMessages = messages.map((msg: Message, index: number) => ({
            id: crypto.randomUUID(),
            sessionId: session.id,
            role: msg.role,
            content: msg.content,
            thinking: msg.thinking,
            createdAt: session.metadata.createdAt + index, // 順序を保証
          }));

          if (newMessages.length > 0) {
            await tx.table('messages').bulkAdd(newMessages);
          }
        }

        // 3. セッションから messages を削除
        for (const session of sessions) {
          const sessionData = session.data as Record<string, unknown>;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { messages: _messages, ...restData } = sessionData;
          await tx.table('chatSessions').update(session.id, {
            data: restData,
          });
        }
      });
  }
}

export const db = new ChatDatabase();
