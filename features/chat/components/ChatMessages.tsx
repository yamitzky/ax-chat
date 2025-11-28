'use client'

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, User } from "lucide-react"
import type { Message } from "../types"
import { useScrollToBottom } from "../hooks/use-scroll-to-bottom"
import { MarkdownMessage } from "./MarkdownMessage"
import { ThinkingDisplay } from "./ThinkingDisplay"

type Props = {
  messages: Message[];
  isLoading: boolean;
  completion: string;
  thinking?: string;
};

export function ChatMessages({ messages, isLoading, completion, thinking }: Props) {
  const scrollRef = useScrollToBottom([messages, completion, thinking, isLoading]);

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

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 ${
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <Avatar className="w-8 h-8 border shadow-sm">
                <AvatarFallback className={msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col max-w-[85%]">
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm wrap-break-word ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-none whitespace-pre-wrap'
                      : 'bg-muted/80 text-foreground rounded-bl-none border'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <MarkdownMessage content={msg.content} />
                  ) : (
                    msg.content
                  )}
                </div>
                {/* アシスタントメッセージのthinking表示 */}
                {msg.role === 'assistant' && msg.thinking && (
                  <ThinkingDisplay thinking={msg.thinking} />
                )}
              </div>
            </div>
          ))}
          
          {/* Streaming Response Display */}
          {isLoading && (
            <div className="flex gap-3 flex-row">
              <Avatar className="w-8 h-8 border shadow-sm">
                 <AvatarFallback className="bg-muted"><Bot className="w-4 h-4" /></AvatarFallback>
              </Avatar>
              <div className="flex flex-col max-w-[85%]">
                <div className="bg-muted/80 text-foreground rounded-2xl rounded-bl-none px-4 py-2.5 text-sm border shadow-sm wrap-break-word">
                  <MarkdownMessage content={completion} />
                  <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-primary/50 animate-pulse"/>
                </div>
                {/* リアルタイムthought表示 */}
                {thinking && (
                  <ThinkingDisplay thinking={thinking} isStreaming={true} />
                )}
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>
    </CardContent>
  );
}
