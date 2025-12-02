"use client"

import { useState } from "react"
import { CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useScrollToBottom } from "@/lib/hooks/use-scroll-to-bottom"
import { useChatSessionOperations } from "../operations/use-chat-session-operations"
import type { Message } from "../types"
import { MessageItem } from "./MessageItem"
import { WelcomeMessage } from "./WelcomeMessage"

type Props = {
  messages: Message[]
  isLoading: boolean
}

export function ChatMessages({ messages, isLoading }: Props) {
  const scrollRef = useScrollToBottom([messages, isLoading])
  const { editMessage } = useChatSessionOperations()
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
        <div className="flex flex-col gap-4 pb-4">
          {/* Welcome Message */}
          {messages.length === 0 && !isLoading && <WelcomeMessage />}

          {messages.map((msg, index) => {
            const isStreaming =
              isLoading &&
              index === messages.length - 1 &&
              msg.role === "assistant"
            const isEditing = editingMessageId === msg.id

            return (
              <MessageItem
                key={msg.id}
                message={msg}
                isStreaming={isStreaming}
                isEditing={isEditing}
                editContent={editContent}
                onEditStart={() => handleEditStart(msg.id, msg.content)}
                onEditChange={setEditContent}
                onEditSave={() => handleEditSave(msg.id)}
                onEditCancel={handleEditCancel}
              />
            )
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>
    </CardContent>
  )
}
