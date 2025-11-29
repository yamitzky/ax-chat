import type { LLMProvider } from '@/lib/model-types';
import type { Session } from '@/lib/session/types';

// 再エクスポート
export type { Session };

export type Message = {
  id: string;  // メッセージID
  sessionId: string;  // セッションへの外部キー
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;  // AIの思考プロセス（オプショナル）
  createdAt: number;  // メッセージの作成順序を保証
};

/**
 * チャットセッションのデータ型
 */
export interface ChatSessionData {
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
