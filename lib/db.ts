import Dexie, { type Table } from 'dexie';
import type { Session } from '@/features/chat/types';

export class ChatDatabase extends Dexie {
  sessions!: Table<Session, string>;

  constructor() {
    super('axchat');
    this.version(1).stores({
      sessions: 'id, metadata.updatedAt, metadata.createdAt',
    });
  }
}

export const db = new ChatDatabase();
