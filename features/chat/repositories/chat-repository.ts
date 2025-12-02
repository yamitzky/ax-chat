import { createContext, useContext } from "react"
import type { LLMProvider } from "@/lib/ai/providers"
import { db } from "../infrastructure/db"
import type { ChatSession, Message } from "../types"

export interface ChatRepository {
  // セッション操作
  findAllSessions(): Promise<ChatSession[]>
  createSession(session: ChatSession): Promise<void>
  updateSession(session: ChatSession): Promise<void>

  // 部分更新メソッド（パフォーマンス向上）
  updateSessionTitle(sessionId: string, title: string): Promise<void>
  updateSessionLLMProvider(
    sessionId: string,
    provider: LLMProvider,
  ): Promise<void>
  updateSessionTimestamp(sessionId: string): Promise<void>

  // メッセージ操作
  findMessagesBySessionId(sessionId: string): Promise<Message[]>
  createMessage(message: Message): Promise<void>
  updateMessage(messageId: string, updates: Partial<Message>): Promise<void>
  deleteMessage(messageId: string): Promise<void>
  deleteMessagesAfter(messageId: string, sessionId: string): Promise<void>
}

export class DexieChatRepository implements ChatRepository {
  async findAllSessions(): Promise<ChatSession[]> {
    return await db.chatSessions
      .orderBy("metadata.updatedAt")
      .reverse()
      .toArray()
  }

  async createSession(session: ChatSession): Promise<void> {
    await db.chatSessions.add(session)
  }

  async updateSession(session: ChatSession): Promise<void> {
    await db.chatSessions.put(session)
  }

  async findMessagesBySessionId(sessionId: string): Promise<Message[]> {
    return await db.messages
      .where("sessionId")
      .equals(sessionId)
      .sortBy("createdAt")
  }

  async createMessage(message: Message): Promise<void> {
    await db.messages.add(message)
  }

  async updateMessage(
    messageId: string,
    updates: Partial<Message>,
  ): Promise<void> {
    await db.messages.update(messageId, updates)
  }

  async deleteMessage(messageId: string): Promise<void> {
    await db.messages.delete(messageId)
  }

  async deleteMessagesAfter(
    messageId: string,
    sessionId: string,
  ): Promise<void> {
    const targetMessage = await db.messages.get(messageId)
    if (!targetMessage) {
      return
    }

    // 指定メッセージより後のメッセージを削除
    await db.messages
      .where("sessionId")
      .equals(sessionId)
      .filter((msg) => msg.createdAt > targetMessage.createdAt)
      .delete()
  }

  async updateSessionTitle(sessionId: string, title: string): Promise<void> {
    await db.chatSessions.update(sessionId, {
      title,
      "metadata.updatedAt": Date.now(),
    })
  }

  async updateSessionLLMProvider(
    sessionId: string,
    provider: LLMProvider,
  ): Promise<void> {
    await db.chatSessions.update(sessionId, {
      "data.llmProvider": provider,
      "metadata.updatedAt": Date.now(),
    })
  }

  async updateSessionTimestamp(sessionId: string): Promise<void> {
    await db.chatSessions.update(sessionId, {
      "metadata.updatedAt": Date.now(),
    })
  }
}

const ChatRepositoryContext = createContext<ChatRepository | null>(null)

export const ChatRepositoryProvider = ChatRepositoryContext.Provider

export const useChatRepository = () => {
  const context = useContext(ChatRepositoryContext)
  if (!context) {
    throw new Error("ChatRepositoryContext not found")
  }
  return context
}
