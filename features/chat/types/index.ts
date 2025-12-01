import type { LLMProvider } from "@/lib/ai/providers"

export type Message = {
  id: string // メッセージID
  sessionId: string // セッションへの外部キー
  role: "user" | "assistant"
  content: string
  thinking?: string // AIの思考プロセス（オプショナル）
  createdAt: number // メッセージの作成順序を保証
}

/**
 * チャットセッションのデータ型
 */
export interface ChatSessionData {
  llmProvider: LLMProvider // より明確な命名
  useWebSearch: boolean
}

export interface Session<TData> {
  id: string
  title: string
  data: TData
  metadata: {
    createdAt: number
    updatedAt: number
  }
}

/**
 * チャットセッション型
 */
export type ChatSession = Session<ChatSessionData>

/**
 * 仮セッション（メモリ内のみ存在、DB未保存）
 */
export interface DraftChatSession {
  title: string
  data: ChatSessionData
  // idは持たない（コミット時に生成）
}

/**
 * セッション一覧アイテム型（後方互換性のため保持）
 */
export type SessionListItem = {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  provider: LLMProvider
}
