import { db } from '@/lib/db';
import { createSessionQueries } from '@/lib/session/queries';

/**
 * チャット専用の Query hooks を生成
 */
export const {
  useSession: useChatSession,
  useSessionList: useChatSessionList,
} = createSessionQueries(db.chatSessions);
