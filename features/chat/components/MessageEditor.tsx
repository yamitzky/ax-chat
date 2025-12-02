"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

type MessageEditorProps = {
  content: string
  isStreaming: boolean
  onChange: (content: string) => void
  onSave: () => void
  onCancel: () => void
}

export function MessageEditor({
  content,
  isStreaming,
  onChange,
  onSave,
  onCancel,
}: MessageEditorProps) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <Textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[80px] resize-none"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            onSave()
          } else if (e.key === "Escape") {
            onCancel()
          }
        }}
      />
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={onSave}
          disabled={isStreaming || !content.trim()}
        >
          保存
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={isStreaming}
        >
          キャンセル
        </Button>
        <span className="text-xs text-muted-foreground">
          Cmd/Ctrl+Enter で保存、Esc でキャンセル
        </span>
      </div>
    </div>
  )
}
