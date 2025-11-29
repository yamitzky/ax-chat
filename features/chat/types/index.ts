import type { LLMProvider } from '@/lib/model-types';
import type { Session } from '@/lib/session/types';

export type Message = {
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;  // AIの思考プロセス（オプショナル）
};

/**
 * チャットセッションのデータ型
 */
export interface ChatSessionData {
  messages: Message[];
  llmProvider: LLMProvider;  // より明確な命名
  useWebSearch: boolean;
}

/**
 * チャットセッション型（汎用Session型を使用）
 */
export type ChatSession = Session<ChatSessionData>;

/**
 * セッション一覧アイテム型（後方互換性のため保持）
 */
export type SessionListItem = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  provider: LLMProvider;
};
