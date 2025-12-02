"use client"

import { Bot, User } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useChatSessionOperations } from "../operations/use-chat-session-operations"
import type { Message } from "../types"
import { CopyButton } from "./CopyButton"
import { MessageActions } from "./MessageActions"
import { MessageBubble } from "./MessageBubble"
import { MessageEditor } from "./MessageEditor"
import { ThinkingDisplay } from "./ThinkingDisplay"

type MessageItemProps = {
  message: Message
  isStreaming: boolean
  isEditing: boolean
  editContent: string
  onEditStart: () => void
  onEditChange: (content: string) => void
  onEditSave: () => void
  onEditCancel: () => void
}

export function MessageItem({
  message,
  isStreaming,
  isEditing,
  editContent,
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel,
}: MessageItemProps) {
  const { regenerateMessage } = useChatSessionOperations()

  const handleRegenerate = async () => {
    await regenerateMessage(message.id)
  }

  return (
    <div
      className={`group flex gap-3 ${
        message.role === "user" ? "flex-row-reverse" : "flex-row"
      }`}
    >
      <Avatar className="w-8 h-8 border shadow-sm">
        <AvatarFallback
          className={
            message.role === "user"
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          }
        >
          {message.role === "user" ? (
            <User className="w-4 h-4" />
          ) : (
            <Bot className="w-4 h-4" />
          )}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col max-w-[85%]">
        <div className="flex items-start gap-1">
          {message.role === "user" && !isEditing && (
            <CopyButton content={message.content} />
          )}
          {isEditing ? (
            <MessageEditor
              content={editContent}
              isStreaming={isStreaming}
              onChange={onEditChange}
              onSave={onEditSave}
              onCancel={onEditCancel}
            />
          ) : (
            <MessageBubble message={message} isStreaming={isStreaming} />
          )}
          {message.role === "assistant" && !isEditing && (
            <CopyButton content={message.content} />
          )}
          {!isEditing && (
            <MessageActions
              message={message}
              isStreaming={isStreaming}
              onEdit={onEditStart}
              onRegenerate={handleRegenerate}
            />
          )}
        </div>
        {/* アシスタントメッセージのthinking表示 */}
        {message.role === "assistant" && message.thinking && !isEditing && (
          <ThinkingDisplay
            thinking={message.thinking}
            isStreaming={isStreaming}
          />
        )}
      </div>
    </div>
  )
}
