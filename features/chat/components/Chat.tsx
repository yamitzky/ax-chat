"use client"

import { useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { Card } from "@/components/ui/card"
import type { LLMProvider } from "@/lib/ai/providers"
import { cn } from "@/lib/utils"
import { useChatSessionOperations } from "../operations/use-chat-session-operations"
import { useChatSessionStore } from "../store/use-chat-session-store"
import { ChatHeader } from "./ChatHeader"
import { ChatInput } from "./ChatInput"
import { ChatMessages } from "./ChatMessages"
import { SessionSidebar } from "./SessionSidebar"

export default function Chat() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("sessionId")

  // Query: 状態の読み取り
  const activeMessages = useChatSessionStore((state) => state.activeMessages)
  const isStreaming = useChatSessionStore((state) => state.isStreaming)
  const draftSession = useChatSessionStore((state) => state.draftSession)
  const sidebarOpen = useChatSessionStore((state) => state.sidebarOpen)
  const activeSession = useChatSessionStore((state) =>
    state.activeSessionId
      ? state.sessions.find((s) => s.id === state.activeSessionId)
      : draftSession,
  )

  // Command: 操作
  const { sendMessage, updateLLMProvider, abortStream, initializeSession } =
    useChatSessionOperations()
  const toggleSidebar = useChatSessionStore((state) => state.toggleSidebar)
  const closeSidebar = useChatSessionStore((state) => state.closeSidebar)

  useEffect(() => {
    initializeSession(sessionId)
  }, [initializeSession, sessionId])

  const handleSend = async (content: string) => {
    if (isStreaming) return

    try {
      await sendMessage(sessionId, content)
    } catch (err) {
      console.error("Send error:", err)
    }
  }

  const handleProviderChange = async (newProvider: LLMProvider) => {
    await updateLLMProvider(sessionId, newProvider)
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <SessionSidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-200",
          sidebarOpen && "md:ml-64",
        )}
      >
        <Card className="flex-1 flex flex-col shadow-xl border-zinc-200 dark:border-zinc-800 bg-card/50 backdrop-blur-sm rounded-none md:rounded-lg md:m-4 md:h-[calc(100vh-2rem)] overflow-hidden">
          <ChatHeader
            sidebarOpen={sidebarOpen}
            onToggleSidebar={toggleSidebar}
            provider={activeSession?.data.llmProvider ?? "gemini-flash"}
            onProviderChange={handleProviderChange}
          />

          <ChatMessages messages={activeMessages} isLoading={isStreaming} />

          <ChatInput
            isLoading={isStreaming}
            onSubmit={handleSend}
            onAbort={abortStream}
          />
        </Card>
      </div>
    </div>
  )
}
