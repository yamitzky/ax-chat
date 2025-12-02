"use client"

import { useEffect, useRef, useState } from "react"
import { CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useScrollToMessage } from "@/lib/hooks/use-scroll-to-bottom"
import { useChatSessionOperations } from "../operations/use-chat-session-operations"
import type { Message } from "../types"
import { MessageItem } from "./MessageItem"
import { WelcomeMessage } from "./WelcomeMessage"

type Props = {
  messages: Message[]
  isLoading: boolean
}

export function ChatMessages({ messages, isLoading }: Props) {
  const { containerRef, scrollToMessage } = useScrollToMessage()
  const { editMessage } = useChatSessionOperations()
  const prevIsLoadingRef = useRef(isLoading)

  // ストリーミング開始時（isLoading: false → true）にユーザーメッセージへスクロール
  useEffect(() => {
    const wasLoading = prevIsLoadingRef.current
    prevIsLoadingRef.current = isLoading

    // false → true の変化を検知
    if (!wasLoading && isLoading && messages.length >= 2) {
      // 最後から2番目がユーザーメッセージ（最後はアシスタントの空メッセージ）
      const userMessage = messages[messages.length - 2]
      if (userMessage?.role === "user") {
        // 少し遅延させてDOMが更新されるのを待つ
        const timer = setTimeout(() => {
          scrollToMessage(userMessage.id)
        }, 50)
        return () => clearTimeout(timer)
      }
    }
  }, [isLoading, messages, scrollToMessage])

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")

  const handleEditStart = (messageId: string, content: string) => {
    setEditingMessageId(messageId)
    setEditContent(content)
  }

  const handleEditCancel = () => {
    setEditingMessageId(null)
    setEditContent("")
  }

  const handleEditSave = async (messageId: string) => {
    const message = messages.find((m) => m.id === messageId)
    if (!message) {
      return
    }

    if (editContent.trim() === message.content.trim()) {
      handleEditCancel()
      return
    }

    const contentToSave = editContent.trim()
    // 先に編集モードを解除
    setEditingMessageId(null)
    setEditContent("")
    try {
      await editMessage(messageId, contentToSave)
    } catch (error) {
      console.error("Failed to save edit:", error)
      // エラーが発生した場合は編集モードに戻す
      setEditingMessageId(messageId)
      setEditContent(contentToSave)
    }
  }

  return (
    <CardContent className="flex-1 p-0 overflow-hidden relative">
      <ScrollArea className="h-full p-4">
        <div ref={containerRef} className="flex flex-col gap-4 pb-4">
          {/* Welcome Message */}
          {messages.length === 0 && !isLoading && <WelcomeMessage />}

          {messages.map((msg, index) => {
            const isStreaming =
              isLoading &&
              index === messages.length - 1 &&
              msg.role === "assistant"
            const isEditing = editingMessageId === msg.id

            return (
              <div key={msg.id} data-message-id={msg.id}>
                <MessageItem
                  message={msg}
                  isStreaming={isStreaming}
                  isEditing={isEditing}
                  editContent={editContent}
                  onEditStart={() => handleEditStart(msg.id, msg.content)}
                  onEditChange={setEditContent}
                  onEditSave={() => handleEditSave(msg.id)}
                  onEditCancel={handleEditCancel}
                />
              </div>
            )
          })}

          {/* スペーサー: ユーザーメッセージを上部にスクロールできるよう領域を確保 */}
          {isLoading && messages.length > 0 && (
            <div className="min-h-screen" aria-hidden="true" />
          )}
        </div>
      </ScrollArea>
    </CardContent>
  )
}
