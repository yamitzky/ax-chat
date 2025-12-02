import { useRouter } from "next/navigation"
import { useCallback } from "react"
import type { LLMProvider } from "@/lib/ai/providers"
import { apiClient } from "@/lib/apiClient"
import { useStreamFetch } from "@/lib/stream/use-stream-fetch"
import { chatResponseDeltaSchema } from "../api/schemas"
import { useChatRepository } from "../repositories/chat-repository"
import { useChatSessionStore } from "../store/use-chat-session-store"
import type { ChatSession, Message } from "../types"
import { generateTitle } from "../utils/title-generator"

type AccumulatedMessage = { answer?: string; thought?: string }

export function useChatSessionOperations() {
  const router = useRouter()
  const { fetchStream, abort, abortSignal } = useStreamFetch(
    chatResponseDeltaSchema,
  )
  const chatRepository = useChatRepository()

  // 初期化(ページロード時の最初の１回のみ)
  const initialize = useCallback(async () => {
    const sessions = await chatRepository.findAllSessions()
    const state = useChatSessionStore.getState()
    state.setSessions(sessions)
    state.initializeDraftSession()
  }, [chatRepository])

  // セッション切り替え
  const switchSession = useCallback(
    async (sessionId: string | null) => {
      if (sessionId) {
        router.replace(`/?sessionId=${sessionId}`)
      } else {
        router.replace("/")
      }
    },
    [router],
  )

  // セッション切替時の初期化
  const initializeSession = useCallback(
    async (sessionId: string | null) => {
      const state = useChatSessionStore.getState()
      let messages: Message[] = []
      if (sessionId) {
        messages = await chatRepository.findMessagesBySessionId(sessionId)
      } else {
        state.initializeDraftSession()
      }
      state.setActiveSession(sessionId, messages)
    },
    [chatRepository],
  )

  // タイトル更新
  const updateTitle = useCallback(
    async (sessionId: string, title: string) => {
      // メモリ更新
      const state = useChatSessionStore.getState()
      state.updateSessionTitle(sessionId, title)

      // DB部分更新（全量取得不要）
      await chatRepository.updateSessionTitle(sessionId, title)
    },
    [chatRepository],
  )

  // LLMプロバイダー更新
  const updateLLMProvider = useCallback(
    async (sessionId: string | null, provider: LLMProvider) => {
      const state = useChatSessionStore.getState()
      state.updateSessionLLMProvider(sessionId, provider)
      if (sessionId) {
        await chatRepository.updateSessionLLMProvider(sessionId, provider)
      }
    },
    [chatRepository],
  )

  // メッセージ送信（ストリーム処理含む）
  const sendMessage = useCallback(
    async (sessionId: string | null, content: string) => {
      const state = useChatSessionStore.getState()
      let currentSession: ChatSession

      // 1. 仮セッションのコミット
      if (sessionId === null) {
        sessionId = crypto.randomUUID()

        const title = generateTitle(content)
        currentSession = state.commitDraftSession(sessionId, title)

        // DB保存
        await chatRepository.createSession(currentSession)

        // URL更新
        router.replace(`/?sessionId=${sessionId}`)
        state.setActiveSession(sessionId, [])
      } else {
        currentSession = state.sessions.find((s) => s.id === sessionId)!
      }

      // 2. ユーザーメッセージ追加
      const userMessage: Message = {
        id: crypto.randomUUID(),
        sessionId,
        role: "user",
        content,
        createdAt: Date.now(),
      }

      state.addMessage(userMessage)
      await chatRepository.createMessage(userMessage)

      const streamingMessageId = crypto.randomUUID()
      const assistantMessage: Message = {
        id: streamingMessageId,
        sessionId,
        role: "assistant",
        content: "",
        createdAt: Date.now(),
      }

      // 仮の状態でメモリ、DBに保存
      state.addMessage(assistantMessage)
      await chatRepository.createMessage(assistantMessage)

      try {
        state.startStreaming()
        const result = (await fetchStream(
          apiClient.chat.$post(
            {
              json: {
                prompt: content,
                history: state.activeMessages.map((m) => ({
                  role: m.role,
                  content: m.content,
                })),
                llmProvider: currentSession.data.llmProvider,
                useWebSearch: currentSession.data.useWebSearch,
              },
            },
            {
              init: {
                signal: abortSignal,
              },
            },
          ),
          {
            onStream: async (_, accumulated) => {
              const acc = accumulated as AccumulatedMessage
              const update = {
                content: acc.answer || "",
                thinking: acc.thought,
              }
              state.updateMessage(streamingMessageId, update)
            },
          },
        )) as AccumulatedMessage
        state.updateMessage(streamingMessageId, {
          content: result.answer || "",
          thinking: result.thought,
        })
      } catch (error) {
        console.error(error)
      } finally {
        state.finishStreaming()

        // メッセージの受信が完了してから永続化
        // 最終的なストア上のメッセージ
        const messageToSave = useChatSessionStore
          .getState()
          .activeMessages.find((m) => m.id === streamingMessageId)
        if (messageToSave) {
          await chatRepository.updateMessage(streamingMessageId, messageToSave)
        }

        // セッションのupdatedAt更新
        state.updateSessionTimestamp(sessionId)
        await chatRepository.updateSessionTimestamp(sessionId)
      }
    },
    [fetchStream, router, chatRepository, abortSignal],
  )

  // AIメッセージの再生成
  const regenerateMessage = useCallback(
    async (messageId: string) => {
      const state = useChatSessionStore.getState()
      const sessionId = state.activeSessionId
      if (!sessionId) {
        return
      }

      const targetMessage = state.activeMessages.find((m) => m.id === messageId)
      if (!targetMessage || targetMessage.role !== "assistant") {
        return
      }

      // 指定メッセージ以降を削除
      const targetIndex = state.activeMessages.findIndex(
        (m) => m.id === messageId,
      )
      if (targetIndex === -1) {
        return
      }

      // その前のユーザーメッセージを探す
      let userMessageIndex = -1
      for (let i = targetIndex - 1; i >= 0; i--) {
        if (state.activeMessages[i].role === "user") {
          userMessageIndex = i
          break
        }
      }

      if (userMessageIndex === -1) {
        return
      }

      const userMessage = state.activeMessages[userMessageIndex]

      // 再生成用の履歴を構築（削除前の状態から）
      const historyMessages = state.activeMessages
        .slice(0, userMessageIndex + 1)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }))

      // 指定メッセージ以降を削除（指定メッセージ自体は含まれないので、先に指定メッセージ以降を削除してから指定メッセージ自体を削除）
      state.deleteMessagesAfter(messageId)
      // DBから削除（指定メッセージ以降）
      await chatRepository.deleteMessagesAfter(messageId, sessionId)

      // 指定メッセージ自体を削除
      state.deleteMessage(messageId)
      await chatRepository.deleteMessage(messageId)

      const currentSession = state.sessions.find((s) => s.id === sessionId)!

      // 既存のメッセージIDを再利用して更新
      const assistantMessage: Message = {
        id: messageId,
        sessionId,
        role: "assistant",
        content: "",
        thinking: undefined,
        createdAt: targetMessage.createdAt, // 元の作成時刻を保持
      }

      // 仮の状態でメモリ、DBに保存
      state.addMessage(assistantMessage)
      await chatRepository.createMessage(assistantMessage)

      try {
        state.startStreaming()
        const result = (await fetchStream(
          apiClient.chat.$post(
            {
              json: {
                prompt: userMessage.content,
                history: historyMessages,
                llmProvider: currentSession.data.llmProvider,
                useWebSearch: currentSession.data.useWebSearch,
              },
            },
            {
              init: {
                signal: abortSignal,
              },
            },
          ),
          {
            onStream: async (_, accumulated) => {
              const acc = accumulated as AccumulatedMessage
              const update = {
                content: acc.answer || "",
                thinking: acc.thought,
              }
              state.updateMessage(messageId, update)
            },
          },
        )) as AccumulatedMessage
        state.updateMessage(messageId, {
          content: result.answer || "",
          thinking: result.thought,
        })
      } catch (error) {
        console.error(error)
      } finally {
        state.finishStreaming()

        // メッセージの受信が完了してから永続化
        const messageToSave = useChatSessionStore
          .getState()
          .activeMessages.find((m) => m.id === messageId)
        if (messageToSave) {
          await chatRepository.updateMessage(messageId, messageToSave)
        }

        // セッションのupdatedAt更新
        state.updateSessionTimestamp(sessionId)
        await chatRepository.updateSessionTimestamp(sessionId)
      }
    },
    [fetchStream, chatRepository, abortSignal],
  )

  // メッセージの編集
  const editMessage = useCallback(
    async (messageId: string, newContent: string) => {
      const state = useChatSessionStore.getState()
      const sessionId = state.activeSessionId
      if (!sessionId) {
        return
      }

      const targetMessage = state.activeMessages.find((m) => m.id === messageId)
      if (!targetMessage) {
        return
      }

      const isUserMessage = targetMessage.role === "user"

      const targetIndex = state.activeMessages.findIndex(
        (m) => m.id === messageId,
      )
      if (targetIndex === -1) {
        return
      }

      // 再生成用の履歴を構築（更新・削除前の状態から）
      const historyMessages = state.activeMessages
        .slice(0, targetIndex)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }))
        .concat([
          {
            role: targetMessage.role,
            content: newContent,
          },
        ])

      // メッセージを更新
      const updates: Partial<Message> = { content: newContent }
      // AIメッセージの場合はthinkingフィールドもクリア
      if (!isUserMessage) {
        updates.thinking = undefined
      }
      state.updateMessage(messageId, updates)
      await chatRepository.updateMessage(messageId, updates)

      // AIメッセージの編集時は、その後のメッセージを削除しない（歴史改ざんのみ）
      if (isUserMessage) {
        // ユーザーメッセージの場合、その後のメッセージを削除してAIメッセージを再生成
        state.deleteMessagesAfter(messageId)
        await chatRepository.deleteMessagesAfter(messageId, sessionId)
        const currentSession = state.sessions.find((s) => s.id === sessionId)!

        const streamingMessageId = crypto.randomUUID()
        const assistantMessage: Message = {
          id: streamingMessageId,
          sessionId,
          role: "assistant",
          content: "",
          createdAt: Date.now(),
        }

        // 仮の状態でメモリ、DBに保存
        state.addMessage(assistantMessage)
        await chatRepository.createMessage(assistantMessage)

        try {
          state.startStreaming()
          const result = (await fetchStream(
            apiClient.chat.$post(
              {
                json: {
                  prompt: newContent,
                  history: historyMessages,
                  llmProvider: currentSession.data.llmProvider,
                  useWebSearch: currentSession.data.useWebSearch,
                },
              },
              {
                init: {
                  signal: abortSignal,
                },
              },
            ),
            {
              onStream: async (_, accumulated) => {
                const acc = accumulated as AccumulatedMessage
                const update = {
                  content: acc.answer || "",
                  thinking: acc.thought,
                }
                state.updateMessage(streamingMessageId, update)
              },
            },
          )) as AccumulatedMessage
          state.updateMessage(streamingMessageId, {
            content: result.answer || "",
            thinking: result.thought,
          })
        } catch (error) {
          console.error(error)
        } finally {
          state.finishStreaming()

          // メッセージの受信が完了してから永続化
          const messageToSave = useChatSessionStore
            .getState()
            .activeMessages.find((m) => m.id === streamingMessageId)
          if (messageToSave) {
            await chatRepository.updateMessage(
              streamingMessageId,
              messageToSave,
            )
          }

          // セッションのupdatedAt更新
          state.updateSessionTimestamp(sessionId)
          await chatRepository.updateSessionTimestamp(sessionId)
        }
      }

      // AIメッセージの編集時は、セッションのタイムスタンプのみ更新
      if (!isUserMessage) {
        state.updateSessionTimestamp(sessionId)
        await chatRepository.updateSessionTimestamp(sessionId)
      }
    },
    [fetchStream, chatRepository, abortSignal],
  )

  return {
    initialize,
    switchSession,
    initializeSession,
    updateTitle,
    updateLLMProvider,
    sendMessage,
    regenerateMessage,
    editMessage,
    abortStream: abort,
  }
}
