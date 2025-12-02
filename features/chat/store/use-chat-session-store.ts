import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import type { LLMProvider } from "@/lib/ai/providers"
import type { ChatSession, DraftChatSession, Message } from "../types"

interface ChatSessionStore {
  // === State ===
  sessions: ChatSession[]
  activeSessionId: string | null
  activeMessages: Message[]
  isStreaming: boolean
  draftSession: DraftChatSession | null
  sidebarOpen: boolean

  // === シンプルな操作のみ ===
  setSessions: (sessions: ChatSession[]) => void
  setActiveSession: (sessionId: string | null, messages: Message[]) => void
  addMessage: (message: Message) => void
  updateMessage: (messageId: string, updates: Partial<Message>) => void
  deleteMessage: (messageId: string) => void
  deleteMessagesAfter: (messageId: string) => void
  startStreaming: () => void
  finishStreaming: () => void

  updateSessionTitle: (sessionId: string, title: string) => void
  updateSessionLLMProvider: (
    sessionId: string | null,
    provider: LLMProvider,
  ) => void
  updateSessionTimestamp: (sessionId: string) => void

  // 仮セッション操作
  initializeDraftSession: () => void
  commitDraftSession: (sessionId: string, title: string) => ChatSession

  // サイドバー操作
  toggleSidebar: () => void
  closeSidebar: () => void
}

export const useChatSessionStore = create<ChatSessionStore>()(
  devtools(
    immer((set) => ({
      sessions: [],
      activeSessionId: null,
      activeMessages: [],
      isStreaming: false,
      draftSession: null,
      sidebarOpen: false,

      setSessions: (sessions) => set({ sessions }),
      setActiveSession: (sessionId: string | null, messages: Message[]) =>
        set({ activeSessionId: sessionId, activeMessages: messages }),

      addMessage: (message) =>
        set((state) => {
          state.activeMessages.push(message)
        }),

      updateMessage: (messageId, updates) =>
        set((state) => {
          const msg = state.activeMessages.find(
            (m: Message) => m.id === messageId,
          )
          if (msg) {
            Object.assign(msg, updates)
          }
        }),

      deleteMessage: (messageId) =>
        set((state) => {
          const index = state.activeMessages.findIndex(
            (m: Message) => m.id === messageId,
          )
          if (index !== -1) {
            state.activeMessages.splice(index, 1)
          }
        }),

      deleteMessagesAfter: (messageId) =>
        set((state) => {
          const index = state.activeMessages.findIndex(
            (m: Message) => m.id === messageId,
          )
          if (index !== -1) {
            state.activeMessages.splice(index + 1)
          }
        }),

      startStreaming: () => set({ isStreaming: true }),
      finishStreaming: () => set({ isStreaming: false }),

      updateSessionTitle: (sessionId, title) =>
        set((state) => {
          const session = state.sessions.find(
            (s: ChatSession) => s.id === sessionId,
          )
          if (session) session.title = title
        }),

      updateSessionLLMProvider: (sessionId, provider) =>
        set((state) => {
          if (sessionId) {
            const session = state.sessions.find((s) => s.id === sessionId)
            if (session) session.data.llmProvider = provider
          } else if (state.draftSession) {
            state.draftSession.data.llmProvider = provider
          }
        }),

      updateSessionTimestamp: (sessionId) =>
        set((state) => {
          const session = state.sessions.find(
            (s: ChatSession) => s.id === sessionId,
          )
          if (session) session.metadata.updatedAt = Date.now()
        }),

      initializeDraftSession: () =>
        set({
          draftSession: {
            title: "新規チャット",
            data: {
              llmProvider: "gemini-flash",
              useWebSearch: true,
            },
          },
        }),

      commitDraftSession: (sessionId, title) => {
        const state = useChatSessionStore.getState()
        if (!state.draftSession) {
          throw new Error("No draft session to commit")
        }

        const committedSession: ChatSession = {
          id: sessionId,
          title: title,
          data: state.draftSession.data,
          metadata: {
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        }

        set((draft) => {
          // 先頭に追加
          draft.sessions.unshift(committedSession)
          // 仮セッションをクリア
          draft.draftSession = null
        })

        return committedSession
      },

      toggleSidebar: () =>
        set((state) => {
          state.sidebarOpen = !state.sidebarOpen
        }),
      closeSidebar: () => set({ sidebarOpen: false }),
    })),
    { name: "ChatSessionStore" },
  ),
)
