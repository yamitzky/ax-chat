"use client"

import type { Message } from "../types"
import { MarkdownMessage } from "./MarkdownMessage"

type MessageBubbleProps = {
  message: Message
  isStreaming: boolean
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  return (
    <div
      className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm wrap-break-word ${
        message.role === "user"
          ? "bg-primary text-primary-foreground rounded-br-none whitespace-pre-wrap"
          : "bg-muted/80 text-foreground rounded-bl-none border"
      }`}
    >
      {message.role === "assistant" ? (
        <>
          <MarkdownMessage content={message.content} />
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-primary/50 animate-pulse" />
          )}
        </>
      ) : (
        message.content
      )}
    </div>
  )
}
