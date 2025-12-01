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

  return {
    initialize,
    switchSession,
    initializeSession,
    updateTitle,
    updateLLMProvider,
    sendMessage,
    abortStream: abort,
  }
}
