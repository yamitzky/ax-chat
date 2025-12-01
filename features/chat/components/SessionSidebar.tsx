"use client"

import { useSearchParams } from "next/navigation"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useChatSessionOperations } from "@/features/chat/operations/use-chat-session-operations"
import { cn } from "@/lib/utils"
import { useChatSessionStore } from "../store/use-chat-session-store"
import { NewSessionButton } from "./NewSessionButton"
import { SessionListItem } from "./SessionListItem"

type Props = {
  isOpen: boolean
  onClose: () => void
}

export function SessionSidebar({ isOpen, onClose }: Props) {
  const searchParams = useSearchParams()

  // Query: 状態の読み取り
  const sessions = useChatSessionStore((state) => state.sessions)
  const { switchSession } = useChatSessionOperations()
  // 現在のセッションIDをURLパラメータから取得
  const currentSessionId = searchParams.get("sessionId")

  return (
    <>
      {/* モバイル用オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* サイドバー */}
      <div
        className={cn(
          "fixed z-50 h-screen w-64 border-r bg-card flex flex-col transition-transform duration-200",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="p-4 border-b shrink-0">
          <NewSessionButton onNewSession={onClose} />
        </div>
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {sessions.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  履歴がありません
                </div>
              ) : (
                sessions.map((session) => (
                  <SessionListItem
                    key={session.id}
                    session={session}
                    isActive={session.id === currentSessionId}
                    onClick={() => {
                      switchSession(session.id)
                      onClose()
                    }}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </>
  )
}
