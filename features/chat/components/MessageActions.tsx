"use client"

import { Edit2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Message } from "../types"

type MessageActionsProps = {
  message: Message
  isStreaming: boolean
  onEdit: () => void
  onRegenerate: () => void
}

export function MessageActions({
  message,
  isStreaming,
  onEdit,
  onRegenerate,
}: MessageActionsProps) {
  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={onEdit}
        disabled={isStreaming}
      >
        <Edit2 className="h-3 w-3 text-muted-foreground" />
      </Button>
      {message.role === "assistant" && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onRegenerate}
          disabled={isStreaming}
        >
          <RotateCcw className="h-3 w-3 text-muted-foreground" />
        </Button>
      )}
    </div>
  )
}
