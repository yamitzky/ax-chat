'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Bot, User } from "lucide-react"
import useCompletionRQ from "@/features/chat/hooks/use-completion"

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const { mutateAsync, completion, isLoading } = useCompletionRQ()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, completion, isLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: inputValue }
    setMessages(prev => [...prev, userMessage])
    const prompt = inputValue
    setInputValue("")

    try {
      const response = await mutateAsync(prompt)
      // Add the final response to the messages list
      // Note: During loading, we display the 'completion' variable.
      // Once loaded, we add it to 'messages' and 'completion' is reset by the next mutation or ignored.
      // However, useCompletionRQ resets 'completion' at the START of mutation.
      // So when isLoading becomes false, 'completion' still holds the last value until next mutation.
      
      setMessages(prev => [...prev, { role: 'assistant', content: response }])
    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { role: 'assistant', content: "Error: Failed to get response." }])
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto h-[600px] flex flex-col shadow-xl border-zinc-200 dark:border-zinc-800 bg-card/50 backdrop-blur-sm">
      <CardHeader className="border-b p-4 bg-muted/30">
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-full">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-lg">AI Chat Assistant</span>
        </CardTitle>
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
                <div
                  className={`rounded-2xl px-4 py-2.5 max-w-[85%] text-sm shadow-sm whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-muted/80 text-foreground rounded-bl-none border'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            
            {/* Streaming Response Display */}
            {isLoading && (
              <div className="flex gap-3 flex-row">
                <Avatar className="w-8 h-8 border shadow-sm">
                   <AvatarFallback className="bg-muted"><Bot className="w-4 h-4" /></AvatarFallback>
                </Avatar>
                <div className="bg-muted/80 text-foreground rounded-2xl rounded-bl-none px-4 py-2.5 max-w-[85%] text-sm border shadow-sm whitespace-pre-wrap">
                  {completion}
                  <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-primary/50 animate-pulse"/>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-4 border-t bg-background/50">
        <form onSubmit={handleSubmit} className="flex w-full gap-2 items-end">
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
