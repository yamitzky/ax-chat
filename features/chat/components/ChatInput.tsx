"use client"

import { Send, Square } from "lucide-react"
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"
import { Button } from "@/components/ui/button"
import { CardFooter } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

type Props = {
  isLoading: boolean
  onSubmit: (content: string) => void
  onAbort: () => void
}

export interface ChatInputHandle {
  clear: () => void
  focus: () => void
}

export const ChatInput = forwardRef<ChatInputHandle, Props>(
  ({ isLoading, onSubmit, onAbort }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const [inputValue, setInputValue] = useState("")

    useImperativeHandle(ref, () => ({
      clear: () => setInputValue(""),
      focus: () => textareaRef.current?.focus(),
    }))

    // ページ読み込み時に自動フォーカス
    useEffect(() => {
      textareaRef.current?.focus()
    }, [])

    // 自動リサイズ機能
    useEffect(() => {
      const textarea = textareaRef.current
      if (textarea) {
        // リセットしてから再計算
        textarea.style.height = "auto"
        textarea.style.height = `${textarea.scrollHeight}px`
      }
    }, [])

    const handleSubmit = (e?: React.FormEvent) => {
      if (e) e.preventDefault()
      if (!inputValue.trim() || isLoading) return

      const content = inputValue
      setInputValue("")
      onSubmit(content)
    }

    // キーボードイベントハンドラー
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Ctrl+Enter (または Cmd+Enter on Mac) で送信
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleSubmit()
      }
      // Enterキーはデフォルト動作（改行）を許可
    }

    return (
      <CardFooter className="p-4 border-t bg-background/50">
        <form onSubmit={handleSubmit} className="flex w-full gap-2 items-end">
          <Textarea
            ref={textareaRef}
            placeholder="Type your message... (Ctrl+Enter to send)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={1}
            className="flex-1 bg-background focus-visible:ring-primary/20 resize-none min-h-[40px] max-h-[200px]"
          />
          {isLoading ? (
            <Button
              type="button"
              onClick={onAbort}
              size="icon"
              className="shrink-0"
            >
              <Square className="w-4 h-4" />
              <span className="sr-only">Stop</span>
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!inputValue.trim()}
              size="icon"
              className="shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="sr-only">Send</span>
            </Button>
          )}
        </form>
      </CardFooter>
    )
  },
)

ChatInput.displayName = "ChatInput"
