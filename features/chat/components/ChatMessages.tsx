'use client'

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, Check, Copy, User } from "lucide-react"
import { useState, useCallback } from "react"
import type { Message } from "../types"
import { useScrollToBottom } from "@/lib/hooks/use-scroll-to-bottom"
import { MarkdownMessage } from "./MarkdownMessage"
import { ThinkingDisplay } from "./ThinkingDisplay"

function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground" />
      )}
    </Button>
  );
}

type Props = {
  messages: Message[];
  isLoading: boolean;
};

export function ChatMessages({ messages, isLoading }: Props) {
  const scrollRef = useScrollToBottom([messages, isLoading]);

  return (
    <CardContent className="flex-1 p-0 overflow-hidden relative">
      <ScrollArea className="h-full p-4">
        <div className="flex flex-col gap-4 pb-4">
          {/* Welcome Message */}
          {messages.length === 0 && !isLoading && (
            <div className="text-center text-muted-foreground py-10 text-sm">
              <Bot className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Hello! I am your AI assistant.</p>
              <p>Ask me anything to get started.</p>
            </div>
          )}

          {messages.map((msg, index) => {
            const isStreaming = isLoading && index === messages.length - 1 && msg.role === 'assistant';

            return (
            <div
              key={index}
              className={`group flex gap-3 ${
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <Avatar className="w-8 h-8 border shadow-sm">
                <AvatarFallback className={msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col max-w-[85%]">
                <div className="flex items-start gap-1">
                  {msg.role === 'user' && <CopyButton content={msg.content} />}
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm wrap-break-word ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-none whitespace-pre-wrap'
                        : 'bg-muted/80 text-foreground rounded-bl-none border'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                        <>
                      <MarkdownMessage content={msg.content} />
                          {isStreaming && (
                            <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-primary/50 animate-pulse" />
                          )}
                        </>
                    ) : (
                      msg.content
                    )}
                  </div>
                  {msg.role === 'assistant' && <CopyButton content={msg.content} />}
                </div>
                {/* アシスタントメッセージのthinking表示 */}
                {msg.role === 'assistant' && msg.thinking && (
                    <ThinkingDisplay thinking={msg.thinking} isStreaming={isStreaming} />
                  )}
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>
    </CardContent>
  );
}
