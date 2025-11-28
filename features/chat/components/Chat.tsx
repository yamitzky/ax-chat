'use client'

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AVAILABLE_PROVIDERS, LLMProvider } from "@/lib/model-types"
import { Bot, Send, User } from "lucide-react"
import { useState } from "react"
import { useChat } from "../hooks/use-chat"
import { useScrollToBottom } from "../hooks/use-scroll-to-bottom"
import { ThinkingDisplay } from "./ThinkingDisplay"

export default function Chat() {
  const [provider, setProvider] = useState<LLMProvider>('gemini-flash')
  const { messages, inputValue, setInputValue, isLoading, completion, thinking, handleSend } = useChat({ provider, useWebSearch: true });
  const scrollRef = useScrollToBottom([messages, completion, thinking, isLoading]);

  return (
    <Card className="w-full max-w-2xl mx-auto h-[600px] flex flex-col shadow-xl border-zinc-200 dark:border-zinc-800 bg-card/50 backdrop-blur-sm">
      <CardHeader className="border-b p-4 bg-muted/30 flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-full">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-lg">AI Chat Assistant</span>
        </CardTitle>
        <Select value={provider} onValueChange={(value: LLMProvider) => setProvider(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select LLM Provider" />
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_PROVIDERS.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
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
                    className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm whitespace-pre-wrap break-words ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-muted/80 text-foreground rounded-bl-none border'
                    }`}
                  >
                    {msg.content}
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
                  <div className="bg-muted/80 text-foreground rounded-2xl rounded-bl-none px-4 py-2.5 text-sm border shadow-sm whitespace-pre-wrap break-words">
                    {completion}
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
      <CardFooter className="p-4 border-t bg-background/50">
        <form onSubmit={handleSend} className="flex w-full gap-2 items-end">
          <Input
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-background focus-visible:ring-primary/20"
          />
          <Button type="submit" disabled={isLoading || !inputValue.trim()} size="icon" className="shrink-0">
            <Send className="w-4 h-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
