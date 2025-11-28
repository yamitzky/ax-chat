'use client'

import { Button } from "@/components/ui/button"
import { CardFooter } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"
import { useEffect, useRef } from "react"

type Props = {
  inputValue: string;
  setInputValue: (value: string) => void;
  isLoading: boolean;
  onSubmit: (e?: React.FormEvent) => void;
};

export function ChatInput({ inputValue, setInputValue, isLoading, onSubmit }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ページ読み込み時に自動フォーカス
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // 自動リサイズ機能
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // リセットしてから再計算
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [inputValue]);

  // キーボードイベントハンドラー
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter (または Cmd+Enter on Mac) で送信
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSubmit(e as unknown as React.FormEvent);
    }
    // Enterキーはデフォルト動作（改行）を許可
  };

  return (
    <CardFooter className="p-4 border-t bg-background/50">
      <form onSubmit={onSubmit} className="flex w-full gap-2 items-end">
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
        <Button type="submit" disabled={isLoading || !inputValue.trim()} size="icon" className="shrink-0">
          <Send className="w-4 h-4" />
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </CardFooter>
  );
}
